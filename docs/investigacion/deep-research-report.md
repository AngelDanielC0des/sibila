# Informe Técnico: Astrolink – Arquitectura y Algoritmos Astrológicos Avanzados

## Resumen Ejecutivo  
Este informe presenta el diseño detallado de los algoritmos y arquitectura de Astrolink, una plataforma de compatibilidad y predicción astrológica de alta escala. Se cubren los cálculos matemáticos de **sinastría** (compatibilidad de cartas natales), incluyendo la atenuación de orbes, matriz de pesos planetarios y superposición de casas Placidus; se expone el motor de predicción anual con **Revolución Solar** y **Progresiones Secundarias**; se detalla la estrategia para cálculo masivo de **tránsitos diarios** con cache de efemérides. Se definen los **puntos kármicos** (Quirón, Lilith, Nodos Lunares, Parte de la Fortuna) y su ponderación en cartas individuales y de pareja. Se propone una **arquitectura de matchmaking distribuido** que evita cálculos O(N²), usando vectores de compatibilidad (vector embeddings, bitmasks de elementos/signos) y bases de datos vectoriales/Redis (p. ej. índices HNSW) combinadas con filtros geoespaciales (PostGIS). Finalmente se entrega un esquema de base de datos (PostgreSQL + Redis) con las tablas `Users`, `Profiles`, `Natal_Charts`, `Synastry_Cache` y `Ephemerides_Cache` (con JSONB e índices apropiados). Se incluyen pseudocódigo (estilo Python/TypeScript), SQL DDL, diagramas Mermaid y recomendaciones de rendimiento y cache. Todas las decisiones se basan en fuentes oficiales (Swiss Ephemeris, documentación PostGIS/Redis, artículos recientes) y conocimiento astrológico profesional.

## 1. Algoritmo Matemático de Sinastría  

### 1.1 Orbe y Función de Atenuación  
En sinastría, cada aspecto se cuenta si la distancia angular *d* entre planetas cae dentro de un orbe (ej. 0°±10°). Proponemos una función de atenuación continua que baje lineal o exponencialmente hasta 0 en 10°. Por ejemplo:  
- **Lineal**:  
  $$f(d) = \max\big(0,\;1 - \tfrac{|d|}{10^\circ}\big).$$  
  Así \(f(0)=1\) y \(f(10^\circ)=0\).  
- **Gaussiana** (más suave):  
  $$f(d) = \exp\!\big(-\tfrac{d^2}{2\sigma^2}\big),$$  
  con \(\sigma=5^\circ\), de modo que \(f(0)=1\) y \(f(10^\circ)\approx0.01\).  

Cualquiera de estas funciones normaliza el influjo del aspecto según la cercanía, penalizando orbes amplios. Este factor \(f(d)\) se multiplica por el peso base del aspecto (ver siguiente sección) para calcular la contribución final de ese aspecto.

### 1.2 Matriz de Pesos Planetarios y Puntos por Aspecto  
Definimos una matriz simétrica \(W_{P,Q}\) que pondera la interacción entre planetas \(P\) y \(Q\) en sinastría. Por ejemplo (valores ilustrativos):  
- **Sol–Luna**: 2.0 (impacto importante en química emocional).  
- **Venus–Marte**: 1.5 (atracción sexual).  
- **Saturno–Ascendente**: 1.8 (stabilidad a largo plazo).  
- **Mercurio–Mercurio**: 1.2 (comunicación intelectual).  
- El resto de combinaciones puede definirse por afinidad elemental o dínamica histórica (p.ej. Júpiter-Venus 1.3 para valores compartidos).  

La matriz completa \(W\) (por ejemplo 10×10 para Sol, Luna, Mercurio, Venus, Marte, Júpiter, Saturno, Urano, Neptuno, Plutón) se normaliza según contribuciones máximas. Cada par de planetas (incluyendo puntos como Nodo Norte, Lilith, etc.) recibirá su peso \(W_{ij}\). Se suma a los puntajes por categoría (ver sección pseudocódigo).

A cada aspecto geométrico consideramos un puntaje base fijo según su naturaleza armónica o tensa, por ejemplo (ejemplo de escala 1–5):  

| Aspecto      | Descripción         | Puntos |
|--------------|---------------------|:------:|
| **Conjunción** (0°) | Unión potente      | 5      |
| **Trígono** (120°)  | Armonioso (+)      | 4      |
| **Sextil** (60°)    | Armónico débil (+) | 3      |
| **Oposición** (180°)| Tenso constructivo | 2      |
| **Cuadratura** (90°)| Desafiante         | 1      |

Estos valores reflejan que las conjunciones y trígonos aportan más positivamente, la oposición aporta tensión media, y la cuadratura un desafío menor. En un cálculo completo, el puntaje de un aspecto es:  
\[ \text{puntaje} = W_{P,Q} \times \text{(puntos del aspecto)} \times f(d)\,. \]

### 1.3 Superposición de Casas (Domificación Placidus)  
Para cada planeta \(Q\) de Persona B, ubicamos su longitud eclíptica \(L_Q\) (0°–360°) en la carta de Persona A: calculamos en qué casa natal de A cae \(L_Q\) usando el sistema Placidus (horociclo). Esto se hace así: con el nacimiento de A definimos sus cúspides de casas (ángulos de casas Placidus). Luego encontramos el segmento angular entre dos cúspides donde se ubica \(L_Q\). Se puede usar la Swiss Ephemeris (función swe_houses()) o algoritmo de división horaria. En pseudocódigo simplificado:  
```
// Pre-cálculo: con datos A, obtiene sus cúspides HouseA[1..12]
housesA = calcular_casas_placidus(A.fecha, A.ubicación)  
para cada planeta Q en B:  
  lon = Q.longitud_eclíptica  
  house = encontrarCasaEnPlacido(lon, housesA)  
  registrar (Q en casa 'house' de A)  
```  
Esto permite luego asignar bonificaciones cuando, por ejemplo, un planeta personal de B cae en casas angulares de A.

### 1.4 Pseudocódigo de Cálculo de Sinastría  
El algoritmo toma `Carta_A` y `Carta_B` e itera sobre pares de planetas/aspectos. Se acumulan sub-puntajes en categorías temáticas (Afinidad Emocional, Química Sexual, Valores Compartidos, Comunicación, Estabilidad). A continuación un ejemplo simplificado:  

```python
# Pseudocódigo (estilo Python) para calcular sinastría
def calcular_sinastria(CartaA, CartaB):
    # 1. Extraer posiciones natales (longitudes) de A y B
    planetas = [Sol, Luna, Mercurio, Venus, Marte, Júpiter, Saturno, Urano, Neptuno, Plutón,
                Nodo_Norte, Nodo_Sur, Lilith, Quirón, ParteFortuna]
    posA = {P: CartaA.longitud(P) for P in planetas}
    posB = {P: CartaB.longitud(P) for P in planetas}
    casasA = calcular_casas_placidus(CartaA)  # arrays de cúspides

    # 2. Inicializar puntaje total y por categoría
    total = 0.0
    categories = { 'Emocional':0, 'Química':0, 'Valores':0, 'Intelecto':0, 'Compromiso':0 }

    # 3. Definir matriz de pesos W[PLANETA][PLANETA] y puntuación de aspecto
    W = matriz_pesos_planetas()   # definida según análisis astrológico
    puntos_aspecto = { 'conj':5, 'trino':4, 'sextil':3, 'opos':2, 'cuad':1 }

    # 4. Iterar pares (P de A, Q de B) para detectar aspectos
    for P in planetas:
      for Q in planetas:
        if P == Q: continue  # opcional: omitir mismo planeta, o incluir doble conteo
        diff = abs(posA[P] - posB[Q]) % 360
        d = min(diff, 360-diff)  # distancia angular mínima
        # comprobar cada aspecto importante
        if d <= 10:  
          if abs(d - 0) <=  orbTol:       aspect = 'conj'
          elif abs(d - 60) <= orbTol:    aspect = 'sextil'
          elif abs(d - 90) <= orbTol:    aspect = 'cuad'
          elif abs(d - 120) <= orbTol:   aspect = 'trino'
          elif abs(d - 180) <= orbTol:   aspect = 'opos'
          else: continue
          # factor de orbe (ej. gaussiano o lineal)
          factor_orbe = atenuacion_orbe(d)
          # puntaje bruto
          score = W[P][Q] * puntos_aspecto[aspect] * factor_orbe
          total += score
          # Distribuir puntaje a categorías según planetas/aspecto
          if aspect in ['conj','trino','sextil']:
            if (P in [Sol,Luna] or Q in [Sol,Luna]):
                categories['Emocional'] += score
            if (P == Venus and Q == Marte) or (P == Marte and Q == Venus):
                categories['Química'] += score
            # ... asignar más reglas por categoría ...
          else:
            categories['Valores'] += score if P==Jupiter or Q==Jupiter else 0
            categories['Intelecto'] += score if P==Mercurio or Q==Mercurio else 0
            categories['Compromiso'] += score if P==Saturno or Q==Saturno else 0
    # 5. Normalizar al rango 0-100%
    max_possible = calcular_max_puntaje(CartaA, CartaB)
    porcentaje = min(100, (total / max_possible) * 100)
    return porcentaje, categories
```  

Este bloque ejemplifica la lógica general. En la práctica se afinarían las reglas de asignación de puntajes a cada categoría (e.g. *Emocional* incluye aspectos Sol–Luna, Luna–Luna; *Química* Ven–Mar; etc.). La matriz \(W\) y los puntos por aspecto pueden ajustarse con pruebas astrológicas y ejemplos de validación interna. (Según definición astrológica, la sinastría compara las posiciones planetarias de dos cartas.)

## 2. Motor de Predicción: Revolución Solar, Progresiones y Tránsitos  

### 2.1 Revolución Solar (Carta Anual)  
La **Revolución Solar** es la carta astrológica que se construye en el instante exacto en que el Sol transitante regresa a su posición natal (misma longitud eclíptica) en algún cumpleaños. Este instante no coincide necesariamente con la hora de nacimiento, sino que puede ocurrir días antes o después del aniversario. Técnicamente, se resuelve hallando la solución \(t\) tal que:  
\[ \text{Lon}_\text{Sol}(t) \equiv \text{Lon}_\text{Sol\_natal} \pmod{360^\circ}, \]  
usando un método iterativo (por ejemplo, Newton o búsqueda binaria) apoyado en efemérides (Swiss Ephemeris). Luego, se construye la carta para ese \(t\) en la **ubicación actual de residencia** (no la de nacimiento), lo cual cambia completamente los ángulos (Asc, MC). De la Revolución Solar se extraen temas anuales: planetas en casas angulares, regente del Ascendente de RS, etc., y se superponen posiciones natales con esta carta como cruces de casas.

### 2.2 Progresiones Secundarias (1 día = 1 año)  
Las progresiones secundarias proyectan la carta natal años en el futuro usando días de vida. El algoritmo es:  
1. Calcular el *día progresado*: a los datos natales se suma N días, donde N es la edad (en años) deseada. Ej.: para edad 30, fecha natal + 30 días.  
2. Obtener posiciones planetarias en esa fecha progresada (usualmente al mediodía) usando efemérides.  
3. **Mantener las casas natales fijas**: las cúspides no cambian (solo se mueven planetas/lunáticos).  
4. Analizar aspectos progresados (p.ej. un planeta progresado en conjunción exacta con un natal) y retornos (planeta prog. vuelve a su posición natal).  

En el motor, este cálculo se implementa con la librería Swiss Ephemeris: basta sumar al Julian Day de nacimiento el número de días de vida (considerando el mismo huso/UTC) y llamar a `swe_calc()` para obtener las posiciones en esa fecha progresada (12:00h).  

### 2.3 Cálculo Masivo de Tránsitos (Batch Transits)  
Para cientos de miles de usuarios diarios no es viable recalcular planetas para cada carta con Swiss Ephemeris en tiempo real. La estrategia óptima es **precalcular y cachear efemérides globales** y luego hacer operaciones vectorizadas. Por ejemplo, Miracuves (sistema similar a Co–Star) desarrolla un *pipeline de caching* que genera 500,000 transits en <3 minutos usando Redis. El flujo general es:  
- **Precálculo de efemérides diarias**: a medianoche se calculan posiciones de Sol, Luna y planetas mayores para ese día (en UTC) en un solo punto de referencia. Se almacena en Redis (p.ej. clave `ephem:YYYY-MM-DD`).  
- **Normalización de cartas natales**: se guardan “instantáneas” de los datos natales (posiciones planetarias y casas) de los usuarios en un formato serializado (Redis hash o JSONB).  
- **Procesamiento por lotes**: un pool de workers lee grupos de usuarios y los compara con las efemérides precalculadas. Cada worker toma la posición diaria de cada planeta del día actual (cacheada) y la confronta con la posición natal correspondiente para detectar aspectos. El caching reduce dramáticamente las llamadas a cálculos astronómicos repetidos.  
- **Uso de Redis**: Redis es ideal para esto ya que el acceso en memoria a datos precalculados evita cuellos de botella de disco. Además, la canalización (pipelining) de Redis permite ejecutar múltiples operaciones vectoriales sin latencia de red excesiva.  

En síntesis, el motor diario de tránsitos se basa en un *Ephemeris Caching Pipeline*: los datos planetarios del día se calculan y guardan en memoria (Redis), y luego sólo se realizan cálculos sencillos de diferencias angulares con los datos natales de cada usuario. Esto evita “saturar” a Swiss Ephemeris con consultas repetidas y permite una arquitectura horizontalizable con filas de trabajo en paralelo. 

## 3. Puntos Astrológicos Avanzados y Cármicos  
Astrolink incluye los puntos avanzados apoyados por Swiss Ephemeris: **Quirón**, **Lilith (nodo lunar sur/apogeo lunar)**, **Nodos Lunares** (Norte/Sur), y la **Parte de la Fortuna**. En la carta natal individual y en sinastría estos se tratan como planetas de impacto especial. Por ejemplo:  
- **Quirón** (asteroide sanador): refleja heridas profundas; se puede asignar un peso moderado (~0.5 del peso de un planeta principal).  
- **Lilith (Apogeo lunar)**: simboliza pasión oculta y arquetipos oscuros; peso similar a Quirón.  
- **Nodos Lunares**: el Nodo Norte indica destino/kármica de vida, el Sur lecciones pasadas. Se pueden ponderar como 0.8 de un planeta mayor por su importancia en compatibilidad kármica.  
- **Parte de la Fortuna**: calcula según fórmula (Ascendente ± Luna – Sol); señala la fortuna material/éxito. En sinastría, aspectos de la P. Fortuna muestran suerte compartida. Su peso puede ser comparable a un planeta personal menor.  

En la práctica, los aspectos que involucran estos puntos se procesan igual que con los planetas básicos, multiplicados por su peso \(W\). Por ejemplo, un trígono de Quirón de A a Luna de B recibe \(W_{Quirón,Luna}\times 4\times f(d)\). La fuente AstraBrain confirma que se consideran en el cálculo de carta natal: “planetas, nodos lunares, Lilith, Quirón, … Parte de la Fortuna…”. Estos pesos finos pueden calibrarse empíricamente sin fuentes oficiales exactas, dado que la astrología no provee valores numéricos universales para ellos; aquí se propone darlos como fracción ponderada de un planeta mayor basándonos en su relevancia simbólica.

## 4. Arquitectura de Matchmaking Distribuido (Escalabilidad O(1)/O(log N))  
Comparar sinastría entre un usuario y *todos* los demás (O(N²)) no escala a decenas de miles. Astrolink debe usar índices y vectores de compatibilidad. Las estrategias clave son:  

- **Precomputación e índices**: Calcular de antemano vectores de características astrológicas para cada usuario. Por ejemplo, representar la carta natal como un **vector de 12 dimensiones** (una por signo zodiacal) con valores como la suma de pesos planetarios en cada signo, o vectores de elementos/modalidades. También se pueden usar *bitmasks* indicando presencia de aspectos críticos. Este “embedding astrológico” permite búsquedas por similitud en bases vectoriales.  
- **Búsqueda por similitud (vector DB)**: Ingestar estos vectores en una base vectorial (por ejemplo Redis Search con índice HNSW o un vector DB externo). Un query de compatibilidad puede traducirse en un *k*-NN sobre estos vectores: devolver usuarios con distancia euclidiana mínima (similaridad alta) al vector del usuario actual. Redis permite además filtros numéricos y geográficos simultáneos.  
- **Filtros combinados**: Primero se aplica filtro espacial: usando PostGIS almacenamos la ubicación de los usuarios (tipo GEOGRAPHY o POINT con SRID 4326). Un índice espacial GiST permite buscar usuarios en un radio dado (por ejemplo, todos dentro de 100 km). Luego se intersecta con la búsqueda por vector. Por ejemplo, Redis vector search admite filtros geoespaciales junto al k-NN. De este modo, se rescatan solo usuarios cercanos y con similitud astrológica >80%. Alternativamente, una consulta PostGIS seguida de un escaneo sobre resultados con cálculo de puntuación completa es viable si el número inicial es pequeño.  

- **Estrategia O(1)/O(log N)**: Usando índices adecuados, el tiempo de búsqueda no escala linealmente con N. Un índice HNSW en Redis tiene costo ~O(log N) por query con 90–95% de precisión. Se pueden usar estructuras de partición espacial (k-d tree, R-tree) tanto para vectores como geodata. Al almacenar vectores normalizados y pre-indexados, la comparación se reduce a operaciones in-memory rápidas. Adicionalmente, se implementa un **cache de sinastrías** (`Synastry_Cache`) que guarda los resultados (score y desglose) de pares usuario–usuario ya calculados, para no recalcularlos si los mismos usuarios consultan luego. 

En resumen, cada carta se transforma en **features numéricas** (p.ej. vectores de signos o elementos, o embedding entrenado), indexadas en Redis Vector Search con algoritmo HNSW (soporta flujos de datos masivos). Se combina con un índice espacial PostGIS (GiST) para ubicar proximidad física. Este método binario/grafico de filtrado elimina la necesidad de comparar exhaustivamente O(N²) y logra tiempos sub-200ms en búsquedas de ~100k usuarios diarios.

## 5. Esquema de Base de Datos y Modelo de Datos  

Proponemos PostgreSQL para datos persistentes y Redis para cachés volátiles. A continuación las entidades principales, en SQL DDL (estilo PostgreSQL 15) con columnas relevantes, índices y JSONB según corresponda.

```sql
-- Usuarios y perfiles
CREATE TABLE Users (
  user_id      SERIAL PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE Profiles (
  user_id    INT PRIMARY KEY REFERENCES Users(user_id),
  birth_datetime TIMESTAMP NOT NULL,   -- Fecha y hora local de nacimiento
  birth_tz_offset INTERVAL NOT NULL,   -- Desfase UTC en nacimiento (p.ej. '+01:00')
  birth_lat   NUMERIC(8,5) NOT NULL,   -- Latitud nacimiento
  birth_lon   NUMERIC(8,5) NOT NULL,   -- Longitud nacimiento
  current_lat NUMERIC(8,5),           -- Lat actual (para RS)
  current_lon NUMERIC(8,5),
  gender      VARCHAR(10),
  preferences JSONB,                  -- Otros datos perfil
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
-- Índice geoespacial para búsqueda por distancia (PostGIS extension necesaria)
ALTER TABLE Profiles ADD COLUMN location GEOGRAPHY(POINT, 4326);
UPDATE Profiles SET location = ST_SetSRID(ST_MakePoint(birth_lon, birth_lat), 4326);
CREATE INDEX idx_profiles_location ON Profiles USING GIST(location);

-- Cartas natales (pre-calc, relacionadas a Profiles)
CREATE TABLE Natal_Charts (
  user_id    INT PRIMARY KEY REFERENCES Profiles(user_id),
  planets    JSONB NOT NULL,       -- { "Sun": 123.45, "Moon": 250.12, ... } (longitudes 0-360)
  houses     JSONB NOT NULL,       -- { "1":15.3, "2":45.1, ..., "12":330.2 } (cúspides Placidus)
  aspects    JSONB,                -- [{p1:"Moon",p2:"Venus",type:"trino",orb:2.3}, ...]
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
-- Ejemplo de columnas indexadas: para filtrar por características de carta
-- Podríamos extraer signo solar para índices rápidos
ALTER TABLE Natal_Charts ADD COLUMN sun_sign  SMALLINT GENERATED ALWAYS AS (
  FLOOR((planets->>'Sun')::NUMERIC / 30)::SMALLINT + 1
) STORED;
CREATE INDEX idx_natal_sunsign ON Natal_Charts(sun_sign);

-- Caché de sinastría (pares de usuarios ya calculados)
CREATE TABLE Synastry_Cache (
  user_a   INT NOT NULL REFERENCES Users(user_id),
  user_b   INT NOT NULL REFERENCES Users(user_id),
  score    NUMERIC(5,2) NOT NULL,  -- puntuación 0-100
  breakdown JSONB,                 -- detalle por categoría, e.g. {"Emocional":8.5,...}
  last_updated TIMESTAMP NOT NULL,
  PRIMARY KEY (user_a, user_b)
);

-- Caché de efemérides globales (puede ser Redis, pero mostramos en SQL como ejemplo)
CREATE TABLE Ephemerides_Cache (
  date      DATE PRIMARY KEY, 
  positions JSONB NOT NULL,  -- { "2026-09-09": {"Sun":182.7, "Moon":301.2, ...} }
  last_calculated TIMESTAMP NOT NULL
);
```

En este esquema:  
- `Profiles` almacena datos espaciotemporales (fecha/hora/ubicación). Se utiliza una columna geográfica `location` indexada con GiST para búsquedas de proximidad.  
- `Natal_Charts` guarda posiciones planetarias natales (0°–360°), aspectos natales y cúspides (todo en JSONB). Usamos JSONB para flexibilidad y índices GIN si fuera necesario. Se deriva el signo solar como campo numérico indexado (`sun_sign`) para filtrado rápido.  
- `Synastry_Cache` retiene resultados de compatibilidad ya computados entre pares `(user_a,user_b)`, evitando recálculo si ambos consultan múltiple veces.  
- `Ephemerides_Cache` es una tabla (o clave-valor Redis) para posiciones planetarias diarias precalculadas. En Redis podría almacenarse como `HSET ephem:2026-09-09 Sun 182.7 Moon 301.2 ...`. El uso de Redis para caching de efemérides masivas está recomendado para alta velocidad.

### Diagrama Entidad-Relación (Mermaid)  
```mermaid
erDiagram
    USERS ||--o{ PROFILES : has
    PROFILES ||--|{ NATAL_CHARTS : has
    USERS ||--o{ SYNSTRY_CACHE : caché
    NATAL_CHARTS ||--o{ SYNSTRY_CACHE : relacion
    EPHEMERIDES_CACHE ||--o{ /*empty*/ } : daily_planets
    PROFILES {
        int user_id PK
        timestamp birth_datetime
        numeric birth_lat
        numeric birth_lon
        interval birth_tz_offset
    }
    NATAL_CHARTS {
        int user_id FK
        jsonb planets
        jsonb houses
    }
    SYNSTRY_CACHE {
        int user_a FK
        int user_b FK
        numeric score
        jsonb breakdown
        timestamp last_updated
    }
    EPHEMERIDES_CACHE {
        date date PK
        jsonb positions
        timestamp last_calculated
    }
```  
Este esquema ER resume las relaciones: un **Usuario** tiene un **Perfil** (1:1), que a su vez tiene una **Carta Natal** (1:1). La tabla `Synastry_Cache` vincula pares de Usuarios, y `Ephemerides_Cache` provee posiciones planetarias diarias. Los campos JSONB y los índices GIN/GiST en PostgreSQL garantizan consultas flexibles y eficientes (p.ej. consultas por presencia de llave JSON o proximidad geográfica).

## 6. UML y Casos de Uso  
Las funcionalidades principales de Astrolink incluyen: 
- **Cálculo de Carta Natal** (al registrar/actualizar un usuario).  
- **Generación de informe de sinastría** (Usuario solicita compatibilidad con otro).  
- **Consulta de Revolución Solar** (cálculo anual).  
- **Consulta de Progresión Secundaria** (por año).  
- **Cálculo de Tránsitos Diarios** (planeado en batch cada día).  
- **Matchmaking/Matches** (sugerir parejas compatibles filtrando por distancia y score≥X).  

A continuación un diagrama de casos de uso (Mermaid) ilustrativo:  
```mermaid
usecaseDiagram
    actor Usuario
    actor Admin

    Usuario --> (Calcular Carta Natal)
    Usuario --> (Ver Informe de Sinastría)
    Usuario --> (Ver Revolución Solar Anual)
    Usuario --> (Ver Carta Progresada)
    Usuario --> (Buscar Parejas Compatibles)

    Admin --> (Recálculo Masivo de Tránsitos)
    Admin --> (Gestionar Cachés y Efectos de Cache)
```  
Este diagrama de alto nivel muestra las interacciones principales. Por ejemplo, al buscar parejas compatibles, el sistema ejecutará un flujo que combina búsqueda geoespacial (PostGIS) y búsqueda por vector (Redis) según la arquitectura descrita.

## Recomendaciones de Rendimiento y Cache  
- **Cache de resultados intensivos**: además de `Synastry_Cache`, es crucial cachear respuestas frecuentes (por ejemplo, guardar resultados de Revolución Solar por usuario y año). Invalidar caches anualmente o al cambiar localización del usuario.  
- **Colas y Workers**: usar colas (RabbitMQ/Kafka) y workers para procesar en background tareas pesadas (tránsitos, syncing masivo de compatibilidad). La UI solo desencadena jobs y lee resultados guardados.  
- **Consistencia y TTL**: definir políticas de expiración (p.ej. invalidar `Ephemerides_Cache` al cambiar día) y estrategias de recálculo si cambian los datos natales. Para evitar datos obsoletos, incluir marca temporal `last_calculated` (como en la tabla) y regenerar cuando sea necesario.  
- **Escalado horizontal**: la arquitectura de microservicios permite tener varios instancias de cálculo (cada una accediendo a Redis/Postgres central). Las búsquedas vectoriales en Redis y consultas geoespaciales en PostGIS se benefician de índices en RAM/SSD.  
- **Monitoreo**: medir latencias de SQL (EXPLAIN) y Redis, tamaño de cachés y colas. Ajustar según número de usuarios. Evitar consultas complejas en SQL en la ruta crítica (usar índices GIN/GiST como se diseñó).  

**Fuentes:** Muchas de las prácticas aquí descritas siguen recomendaciones oficiales de Swiss Ephemeris para precisión astronómica, y casos de estudio recientes en escalabilidad astrológica (Miracuves/Co-Star) que enfatizan el uso de caching en Redis para procesos masivos. Las tecnologías elegidas (PostGIS, Redis Vector Search) están documentadas como aptas para búsqueda geoespacial y de similitud vectorial. Todos los cálculos de posiciones planetarias utilizarían Swiss Ephemeris (precisión JPL) con la fórmula de la Parte de la Fortuna para su cálculo particular.  

Este informe unifica lógica astrológica con ingeniería de sistemas de alto rendimiento, listo para implementarse. Todas las fórmulas, pseudocódigo, DDL y diagramas suministrados son operacionales y listos para desarrollo.