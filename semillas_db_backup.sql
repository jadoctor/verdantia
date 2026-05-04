-- Verdantia DB Dump - 2026-05-04T07:39:42.675Z
SET FOREIGN_KEY_CHECKS=0;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS `asociacionesbeneficiosas`;
CREATE TABLE `asociacionesbeneficiosas` (
  `idasociacionesbeneficiosas` int NOT NULL AUTO_INCREMENT,
  `xasociacionesbeneficiosasidespecieorigen` int NOT NULL,
  `xasociacionesbeneficiosasidespeciedestino` int NOT NULL,
  `asociacionesbeneficiosasmotivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`idasociacionesbeneficiosas`),
  KEY `xasociacionesbeneficiosasidespecieorigen` (`xasociacionesbeneficiosasidespecieorigen`),
  KEY `xasociacionesbeneficiosasidespeciedestino` (`xasociacionesbeneficiosasidespeciedestino`),
  CONSTRAINT `asociacionesbeneficiosas_ibfk_1` FOREIGN KEY (`xasociacionesbeneficiosasidespecieorigen`) REFERENCES `especies` (`idespecies`) ON DELETE CASCADE,
  CONSTRAINT `asociacionesbeneficiosas_ibfk_2` FOREIGN KEY (`xasociacionesbeneficiosasidespeciedestino`) REFERENCES `especies` (`idespecies`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `asociacionesbeneficiosas` VALUES(6,10,15,'Sugerido por IA');
INSERT INTO `asociacionesbeneficiosas` VALUES(7,10,16,'Sugerido por IA');
INSERT INTO `asociacionesbeneficiosas` VALUES(8,10,12,'Sugerido por IA');
INSERT INTO `asociacionesbeneficiosas` VALUES(9,10,18,'Sugerido por IA');
INSERT INTO `asociacionesbeneficiosas` VALUES(10,10,17,'Sugerido por IA');
INSERT INTO `asociacionesbeneficiosas` VALUES(11,10,23,'Sugerido por IA');

DROP TABLE IF EXISTS `asociacionesperjudiciales`;
CREATE TABLE `asociacionesperjudiciales` (
  `idasociacionesperjudiciales` int NOT NULL AUTO_INCREMENT,
  `xasociacionesperjudicialesidespecieorigen` int NOT NULL,
  `xasociacionesperjudicialesidespeciedestino` int NOT NULL,
  `asociacionesperjudicialesmotivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`idasociacionesperjudiciales`),
  KEY `xasociacionesperjudicialesidespecieorigen` (`xasociacionesperjudicialesidespecieorigen`),
  KEY `xasociacionesperjudicialesidespeciedestino` (`xasociacionesperjudicialesidespeciedestino`),
  CONSTRAINT `asociacionesperjudiciales_ibfk_1` FOREIGN KEY (`xasociacionesperjudicialesidespecieorigen`) REFERENCES `especies` (`idespecies`) ON DELETE CASCADE,
  CONSTRAINT `asociacionesperjudiciales_ibfk_2` FOREIGN KEY (`xasociacionesperjudicialesidespeciedestino`) REFERENCES `especies` (`idespecies`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `asociacionesperjudiciales` VALUES(4,10,19,'Sugerido por IA');
INSERT INTO `asociacionesperjudiciales` VALUES(5,10,20,'Sugerido por IA');
INSERT INTO `asociacionesperjudiciales` VALUES(6,10,21,'Sugerido por IA');

DROP TABLE IF EXISTS `avisosglobales`;
CREATE TABLE `avisosglobales` (
  `idavisosglobales` int NOT NULL AUTO_INCREMENT,
  `xavisosglobalesidespecies` int DEFAULT NULL,
  `avisosglobalescategoria` enum('riego','cuidado','cosecha','abono','otro') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `avisosglobalestitulo` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `avisosglobalesfaseinicio` enum('siembra','germinacion','trasplante','etapa_adulta','cosecha','siempre','n/a','asentamiento') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `avisosglobalesfasefin` enum('siembra','germinacion','trasplante','etapa_adulta','cosecha','siempre','n/a','asentamiento') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `avisosglobalesoffset` int DEFAULT NULL,
  `avisosglobalesfrecuencia` int DEFAULT NULL,
  `avisosglobalesicono` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'mdi-bell-outline',
  `avisosglobalescolor` varchar(20) COLLATE utf8mb4_general_ci DEFAULT '#3b82f6',
  `avisosglobalesdescripcion` text COLLATE utf8mb4_general_ci,
  `avisosglobalesfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idavisosglobales`),
  KEY `especie_id` (`xavisosglobalesidespecies`),
  CONSTRAINT `avisosglobales_ibfk_1` FOREIGN KEY (`xavisosglobalesidespecies`) REFERENCES `especies` (`idespecies`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `avisosglobales` VALUES(1,3,'riego','Riego germinaci+','siembra','germinacion',0,1,'mdi-bell-outline','#3b82f6','Manten la humedad constante pulverizando agua suavemente hasta que brote.','2026-04-03 10:39:55');
INSERT INTO `avisosglobales` VALUES(2,3,'riego','Riego plantel','germinacion','trasplante',0,2,'mdi-bell-outline','#3b82f6','Riega con moderaci+','2026-04-03 10:39:55');
INSERT INTO `avisosglobales` VALUES(3,3,'riego','Riego de Asentamiento','trasplante','asentamiento',0,3,'mdi-bell-outline','#3b82f6','Riega en profundidad para que la ra+','2026-04-03 10:39:55');
INSERT INTO `avisosglobales` VALUES(4,3,'cuidado','Entutorado y Destalle','trasplante','siempre',15,10,'mdi-bell-outline','#3b82f6','Revisa si necesita atarse al tutor y corta los chupones axilares.','2026-04-03 10:39:55');
INSERT INTO `avisosglobales` VALUES(5,3,'abono','Abono de Fructificaci+','cosecha','cosecha',30,20,'mdi-bell-outline','#3b82f6','A+','2026-04-03 10:39:55');
INSERT INTO `avisosglobales` VALUES(6,3,'cuidado','Escardado (Eliminar malas hierbas)','trasplante','siempre',15,30,'mdi-bell-outline','#3b82f6','Remueve la tierra superficial para oxigenar y quitar competidoras.','2026-04-03 10:39:55');
INSERT INTO `avisosglobales` VALUES(7,3,'riego','Riego de mantenimiento','asentamiento','cosecha',0,5,'mdi-bell-outline','#3b82f6','Riego regular cada 3 d+','2026-04-03 11:08:05');
INSERT INTO `avisosglobales` VALUES(8,3,'cuidado','Desnietado (Poda de chupones)','trasplante','siempre',15,10,'mdi-bell-outline','#3b82f6','La poda de chupones o desnietado consiste en eliminar los brotes laterales axilares para mejorar la ventilaci+','2026-04-03 11:09:42');
INSERT INTO `avisosglobales` VALUES(10,3,'abono','Abono de mantenimiento','trasplante','cosecha',30,20,'mdi-bell-outline','#3b82f6','A+','2026-04-20 08:46:28');

DROP TABLE IF EXISTS `avisoslog`;
CREATE TABLE `avisoslog` (
  `idavisoslog` int NOT NULL AUTO_INCREMENT,
  `xavisoslogidsiembras` int DEFAULT NULL,
  `xavisoslogidusuarios` int DEFAULT NULL,
  `xavisoslogidavisosglobales` int DEFAULT NULL,
  `avisoslogfecharegistro` date DEFAULT NULL,
  `avisoslogfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idavisoslog`),
  UNIQUE KEY `u_log` (`xavisoslogidsiembras`,`xavisoslogidavisosglobales`,`avisoslogfecharegistro`),
  KEY `usuario_id` (`xavisoslogidusuarios`),
  KEY `aviso_global_id` (`xavisoslogidavisosglobales`),
  CONSTRAINT `avisoslog_ibfk_1` FOREIGN KEY (`xavisoslogidsiembras`) REFERENCES `siembras` (`idsiembras`) ON DELETE CASCADE,
  CONSTRAINT `avisoslog_ibfk_2` FOREIGN KEY (`xavisoslogidusuarios`) REFERENCES `usuarios` (`idusuarios`) ON DELETE CASCADE,
  CONSTRAINT `avisoslog_ibfk_3` FOREIGN KEY (`xavisoslogidavisosglobales`) REFERENCES `avisosglobales` (`idavisosglobales`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `blog`;
CREATE TABLE `blog` (
  `idblog` int NOT NULL AUTO_INCREMENT,
  `blogslug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `blogtitulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `blogresumen` text COLLATE utf8mb4_unicode_ci,
  `blogcontenido` longtext COLLATE utf8mb4_unicode_ci,
  `blogimagen` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blogestado` enum('borrador','publicado') COLLATE utf8mb4_unicode_ci DEFAULT 'borrador',
  `xblogidusuarios` int DEFAULT NULL,
  `xblogidespecies` int DEFAULT NULL,
  `xblogidvariedades` int DEFAULT NULL,
  `blogfechacreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `blogfechapublicacion` datetime DEFAULT NULL,
  PRIMARY KEY (`idblog`),
  UNIQUE KEY `xblogslug` (`blogslug`),
  KEY `xblogidusuarios` (`xblogidusuarios`),
  KEY `xblogidespecies` (`xblogidespecies`),
  KEY `xblogidvariedades` (`xblogidvariedades`),
  CONSTRAINT `blog_ibfk_1` FOREIGN KEY (`xblogidusuarios`) REFERENCES `usuarios` (`idusuarios`) ON DELETE SET NULL,
  CONSTRAINT `blog_ibfk_2` FOREIGN KEY (`xblogidespecies`) REFERENCES `especies` (`idespecies`) ON DELETE SET NULL,
  CONSTRAINT `blog_ibfk_3` FOREIGN KEY (`xblogidvariedades`) REFERENCES `variedades` (`idvariedades`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `blog` VALUES(1,'test-slug','Test','Test','Test',NULL,'borrador',1,3,NULL,'2026-04-26 18:12:43',NULL);
INSERT INTO `blog` VALUES(2,'domina-poda-entutorado-tomate','¡Desbloquea Cosechas Épicas! 🍅 La Guía Definitiva de Poda y Entutorado de Tomates para Principiantes y Expertos','Descubre los secretos para maximizar tu cosecha de tomates. Aprende las técnicas clave de poda y entutorado que transformarán tu cultivo, garantizando frutos de mayor calidad y una producción más abundante.','# ¡Desbloquea Cosechas Épicas! 🍅 La Guía Definitiva de Poda y Entutorado de Tomates para Principiantes y Expertos\n\n¿Sueñas con tomates jugosos, grandes y abundantes en tu huerto o invernadero? La clave no está solo en el riego y el sol, sino en dos prácticas culturales *imprescindibles* que a menudo se subestiman: la **poda** y el **entutorado**. Si buscas llevar tu cultivo de tomate al siguiente nivel, esta guía técnica amigable es para ti. ¡Prepárate para transformar tu jardín!\n\n## ¿Por Qué Son Tan Cruciales la Poda y el Entutorado? 🤔\n\nEn el cultivo intensivo de tomate, ya sea en invernadero o al aire libre, estas operaciones no son un lujo, sino una necesidad. Sin ellas, te arriesgas a:\n\n*   Menor producción.\n*   Frutos de menor calidad.\n*   Peligrar la rentabilidad de tu cultivo.\n\nEstas prácticas son la base para encauzar el desarrollo de la planta según tus objetivos, optimizando cada recurso y cada esfuerzo. ¡Vamos a desglosarlas!\n\n## Poda del Tomate: El Arte de Dirigir el Crecimiento 🌱\n\nLa poda es mucho más que simplemente cortar ramas; es una estrategia para mejorar la salud y productividad de tus tomateras. Incluye varias operaciones clave:\n\n### 1. Destallado o Desbrote: El Primer Paso Hacia la Calidad ✨\n\nEl destallado consiste en eliminar los brotes laterales o "chupones" que nacen en las axilas de las hojas, así como los brotes que emergen a ras del suelo. Su objetivo principal es:\n\n*   **Limitar el número de tallos:** Enfocando la energía de la planta en menos frutos, pero de mayor calidad.\n*   **Aumentar la precocidad:** Los frutos maduran antes.\n\n**Ventajas del Destallado:**\n\n*   **Mayor calidad de frutos:** Tomates más grandes, uniformes en color, tersos y limpios.\n*   **Facilidad en las prácticas de cultivo.**\n*   **Mejor control de plagas y enfermedades:** Al haber menos densidad foliar.\n*   **Mayor rapidez y comodidad en la recolección.**\n*   **Aumento de la producción por unidad de superficie:** Aunque cada planta dé menos frutos, puedes cultivar más plantas.\n\n**Inconvenientes:** La principal es la **mano de obra** necesaria y las operaciones asociadas como el entutorado.\n\n**¿Cómo y Cuándo Destallar?**\n\n*   **Elimina los brotes** que salen en las axilas de las hojas de los tallos guía, así como los "chupones" que nacen del suelo.\n*   **Inicia la poda** a partir de la tercera hoja, contada desde el primer racimo de flores.\n*   **Consejo experto:** Corta los brotes cuando no estén muy desarrollados (4-6 cm de largo) para evitar heridas grandes en la planta.\n\n**Factores que Influyen en el Número de Brazos a Dejar:**\n\n*   **Marco de plantación:** Más espacio, más brazos.\n*   **Precocidad deseada:** Menos tallos para mayor precocidad (2 brazos suele ser óptimo).\n*   **Mano de obra disponible.**\n*   **Variedad cultivada.**\n*   **Clima:** En climas húmedos, menos vegetación y brazos para evitar enfermedades.\n\n**¡Cuidado con el Destallado Excesivo!** Un destallado muy enérgico puede causar un desequilibrio fisiológico, resultando en hojas abarquilladas y una "parada" en el desarrollo vegetativo de la planta.\n\n### 2. Clases de Poda: Eligiendo la Estrategia Perfecta ✂️\n\nExisten varias formas de podar tomates, cada una con sus particularidades:\n\n*   **Poda Normal:** Se deja el tallo principal y uno o dos brotes hijos. Se eliminan todos los demás hijuelos.\n*   **Poda del "Curro":** Se dejan uno o dos tallos guías y un tallo adicional ("curro") que se despuntará inmediatamente después de formar el primer racimo de flores.\n*   **Poda Hardy:** Más racional. Se despuntará el tallo principal por encima de la segunda o tercera hoja, después de la primera inflorescencia. De los brotes axilares, se dejan los dos o tres mejores tallos guía.\n*   **Poda en Candelabro Articulado:** Se despunta el tallo principal a unos 20 cm, se dejan dos tallos laterales opuestos, se despuntan tras el primer racimo, se dejan dos nuevos brotes como guías, se pinzan de nuevo y se deja un hijo por cada una de las cuatro guías principales.\n*   **Poda en Candelabro Simple:** Similar al anterior, pero menos compleja. Se pinza el tallo principal a 20-25 cm, se dejan dos brazos principales opuestos. En cada brazo, se destallan todos los hijos excepto el que sale en la axila de la primera hoja debajo del primer racimo de flores, que será un tallo secundario. Así, la planta tendrá dos tallos principales y dos secundarios.\n\n### 3. Poda de Recuperación: Rescatando Cosechas Perdidas 🚑\n\nSi por niebla, frío, heladas u otros factores, los primeros racimos no cuajan bien y la planta tiene pocos frutos, puedes aplicar esta poda para "resetear" la producción:\n\n*   Si la planta se ha podado con dos brazos principales, y hasta 50-75 cm no hay frutos, **despunta** estos dos brazos.\n*   Deja **dos brotes hijos** en cada uno.\n*   Cuando estos cuatro brotes tengan un racimo de flores, **vuelve a despuntarlos**.\n*   Deja **dos hijos más** en cada uno (sumando ocho guías en total) y condúcelos como tallos principales, eliminando todos los brotes que les salgan.\n\n### 4. Pinzamiento o Despunte: Controlando el Ciclo y el Tamaño 📏\n\nEl pinzamiento consiste en cortar las yemas terminales de los tallos guía cuando la planta alcanza la altura deseada. Esta práctica es vital para:\n\n*   **Adelantar la cosecha y disminuir el destrío.**\n*   **Aumentar el tamaño de los frutos** al limitar su número.\n*   **Optimizar variedades de ciclo corto:** No conviene dejar más de cinco racimos florales por tallo.\n\n**Pinzamiento Estratégico para Cultivos de Otoño:**\n\nEn zonas con heladas tempranas o caídas de precios, pinzar las yemas terminales unos **25-30 días antes** de la fecha prevista puede ser un salvavidas. La energía que se gastaría en vegetación que se perderá, se redirige a engrosar y mejorar la calidad de los frutos ya cuajados. ¡Inteligente, verdad!\n\n### 5. Poda de Hojas: Luz y Aire para tus Tomates 🌬️☀️\n\nCuando el follaje es muy denso, la poda de hojas se vuelve esencial. Con ella, mejoras la iluminación y la aireación, lo que se traduce en:\n\n*   **Mayor floración y cuaje de frutos.**\n*   **Mejor calidad de la cosecha.**\n*   **Menos plagas y enfermedades.**\n\n**¿Cómo realizar la Poda de Hojas?**\n\n*   **Elimina hojas envejecidas o enfermas** que dificulten la aireación e iluminación, especialmente aquellas por debajo del primer racimo de frutos.\n*   Si la vegetación es muy densa, arranca **una hoja entre cada dos racimos**, procurando no desgarrar el tallo y evitando dejar "muñones" que puedan ser vías de entrada para enfermedades como la *Botrytis*.\n*   **¡Cuidado!** No arranques demasiadas hojas, ya que esto puede perjudicar gravemente la planta y los frutos.\n*   **Momento ideal:** Realiza la poda de hojas (y el destallado) en las primeras horas de la mañana y, si es posible, en días con ambiente seco para una mejor cicatrización.\n\n## Entutorado o Enramado: El Soporte Que Impulsa el Éxito 🪜\n\nEl entutorado es el sistema de soporte para las plantas de tomate, utilizando cañas, cuerdas, mallas, palos, etc., en posición vertical. ¿Por qué es tan importante?\n\n**Ventajas del Entutorado:**\n\n*   **Adelanto de la recolección:** Mayor exposición solar = más calor = maduración más rápida.\n*   **Tratamientos fitosanitarios más uniformes y efectivos.**\n*   **Mejor floración y cuaje:** Las plantas están mejor ventiladas e iluminadas.\n*   **Mayor comodidad y rapidez** en las prácticas culturales (hormonas, poda, despunte, escardas, recolección).\n*   **Frutos más sanos y limpios:** Se evitan los roces con el suelo, reduciendo ataques de plagas del suelo.\n\n### Clases de Tutores: Elige el Mejor Soporte para Tu Cultivo 🛠️\n\nLos materiales comunes para tutores incluyen cañas, alambres, palos de madera, cuerdas y mallas de hilo. Para las ataduras, se usan espartos, rafia, plásticos o lazos prefabricados.\n\nLas formas de colocar los tutores son variadas:\n\n1.  **Soporte Individual:** Un tutor (caña, estaca, cuerda) por cada planta o tallo, independizado de los demás. En invernaderos, se usan cuerdas o alambres que cuelgan del techo y se atan al cuello de los tallos.\n2.  **Pirámide:** Se colocan 3 o 4 cañas clavadas al lado de los pies de tomate, se atan en la parte superior. Ideal para plantas podadas a un solo tallo. Se puede añadir una caña horizontal para mayor resistencia.\n3.  **Espaldera:** Se clavan cañas o estacas verticalmente cada dos metros, con una altura de más de 1.5 metros. Se colocan cañas horizontales a 0.5m, 1m y 1.5m del suelo, donde se apoyan y atan los tallos. También puede hacerse con alambres y estacas de hierro o madera.\n4.  **Malla de Hilo o Plástico:** Un sistema moderno y económico, especialmente donde escasean los materiales tradicionales. La malla (cuadrícula de 1.5-2 cm) se sujeta a dos alambres paralelos a las líneas de tomate, uno a ras del suelo y otro a la altura deseada.\n5.  **Caballete o Túnel:** Se clavan cañas inclinadas desde dos líneas consecutivas de plantas, atándolas en la parte superior para formar un túnel. **¡Atención!** Este sistema no es aconsejable para cultivos intensivos, ya que retrasa la recolección y crea un ambiente húmedo y templado que favorece el desarrollo de enfermedades.\n\n## Conclusión: Cosechas de Ensueño al Alcance de Tu Mano 🌟\n\nLa poda y el entutorado son pilares fundamentales para el éxito de tu cultivo de tomate. Al entender y aplicar estas técnicas, no solo aumentarás la cantidad de tus cosechas, sino que también mejorarás drásticamente la calidad de cada tomate. Experimenta con las diferentes clases de poda y entutorado para encontrar las que mejor se adapten a tu variedad y condiciones climáticas. ¡Manos a la obra y a disfrutar de esos deliciosos tomates caseros! 🧑‍🌾',NULL,'borrador',1,3,NULL,'2026-04-26 18:19:03',NULL);
INSERT INTO `blog` VALUES(3,'poda-entutorado-tomate-principiantes','¡El Secreto Mejor Guardado para Tomates Gigantes y Cosechas Abundantes! 🍅✨','Descubre las técnicas esenciales de poda y entutorado para transformar tu cultivo de tomate. Consejos prácticos para agricultores principiantes que buscan maximizar su cosecha y calidad.','# ¡El Secreto Mejor Guardado para Tomates Gigantes y Cosechas Abundantes! 🍅✨\n\n¡Hola, futuros maestros tomateros! 👋 Si acabas de empezar en el apasionante mundo del cultivo de tomate, es probable que te sientas un poco abrumado. Pero no te preocupes, estás a punto de descubrir dos prácticas **FUNDAMENTALES** que cambiarán por completo tu experiencia y la calidad de tu cosecha: la poda y el entutorado. 💪\n\nEstas no son solo tareas, son el camino hacia tomates más grandes, sanos y una producción que te dejará con la boca abierta. ¡Vamos a ello!\n\n## 1. Poda del Tomate: ¡Dale Forma a tu Futuro! ✂️🌱\n\nLa poda no es un capricho, es una estrategia. Con ella, no solo controlas el crecimiento de tus plantas, sino que las ayudas a concentrar su energía donde realmente importa: en los frutos. Piensa en ella como una guía para que tus tomates crezcan fuertes y productivos.\n\n### ¿Qué es el Destallado o Desbrote? 🤔\n\nEl destallado, también conocido como desbrote, es la práctica de eliminar los pequeños brotes laterales (llamados "chupones" o "hijuelos") que nacen en las axilas de las hojas principales. Estos brotes compiten por los nutrientes y la luz, restando energía a la producción de frutos.\n\n**¿Por qué es tan importante destallar?**\n\n*   **Mayor Calidad de Frutos** ✨: Tomates más grandes, uniformes en color, más tersos y limpios.\n*   **Cosecha Más Precoz** 🚀: La planta enfoca su energía en madurar los frutos existentes, adelantando la recolección.\n*   **Mejor Control** 🛡️: Facilita la detección y control de plagas y enfermedades.\n*   **Facilidad de Cultivo** 🧑‍🌾: Las plantas son más manejables y la recolección es más cómoda y rápida.\n*   **Aumento de Producción por Superficie** ⬆️: Aunque cada planta dé menos tomates, al poder plantar más por superficie, el rendimiento general aumenta.\n\n### ¿Cuándo y Cómo Destallar? 🗓️🔪\n\nEl momento ideal para empezar la poda es cuando tu planta ha desarrollado al menos la **tercera hoja después del primer racimo floral**. ¡No esperes demasiado!\n\n*   **Elige tus tallos guía**: Para principiantes, te recomendamos dejar **uno o dos tallos principales** (guías). Si dejas uno, tendrás frutos más grandes y precoces. Con dos, un poco más de producción.\n*   **Elimina los "chupones"**: Corta los brotes laterales (hijuelos) cuando estén pequeños, de unos **4 a 6 centímetros**. Así evitarás heridas grandes y la planta se recuperará más rápido. También elimina los "chupones" que salgan a ras del suelo.\n*   **¡Cuidado!** Hazlo con tus uñas o una herramienta limpia para evitar la propagación de enfermedades. Y, si puedes, hazlo en las **primeras horas de la mañana y en días secos** para que las heridas cicatricen mejor.\n\n### El Pinzamiento: ¡Cosechas Más Rápidas y Grandes! 📏🔝\n\nEl pinzamiento consiste en cortar la yema terminal del tallo principal (o de tus tallos guía) cuando la planta ha alcanzado la altura deseada o ha formado un número determinado de racimos (por ejemplo, 5 para variedades de ciclo corto).\n\n**Beneficios del pinzamiento:**\n\n*   **Maduración Acelerada** ☀️: La energía se redirige a los frutos ya formados, que madurarán antes.\n*   **Mayor Tamaño de Fruto** 🍎: Al haber menos frutos, los existentes crecen más.\n*   **Protección contra Heladas** ❄️: En climas fríos, pinzar 25-30 días antes de la primera helada asegura que los frutos ya cuajados tengan tiempo de engrosar antes de que el frío los dañe.\n\n### Poda de Hojas: ¡Luz y Aire para tus Tomates! 🌿🌬️\n\nUn follaje excesivo puede ser contraproducente. La poda de hojas mejora la salud de tu planta.\n\n**¿Por qué podar hojas?**\n\n*   **Mejor Aireación e Iluminación** ☀️💧: Reduce la humedad, previniendo enfermedades como la Botrytis, y permite que la luz llegue a todos los frutos.\n*   **Mayor Floración y Cuaje** 🌸: Las flores reciben más luz y aire, favoreciendo la polinización y el desarrollo del fruto.\n*   **Menos Plagas y Enfermedades** 🐛: Un ambiente menos húmedo y más ventilado es menos atractivo para los patógenos.\n\n**¿Cómo hacerlo?**\n\n*   Elimina hojas viejas, enfermas o aquellas que estén por debajo del primer racimo de frutos y no reciban luz. Son hojas que consumen energía sin aportar.\n*   Si la vegetación es muy densa, retira una hoja entre cada dos racimos. **Evita dejar "muñones"** que puedan ser puerta de entrada para enfermedades.\n*   Al igual que el destallado, hazlo con cuidado, en la mañana y en días secos.\n\n## 2. Entutorado del Tomate: ¡El Soporte que Necesitan tus Plantas! ⬆️💪\n\nImagina que tus plantas de tomate son atletas que necesitan un buen apoyo para alcanzar su máximo potencial. El entutorado es ese soporte, crucial para el desarrollo óptimo de tus frutos.\n\n### ¿Por qué Entutorar? 🤔\n\nSin soporte, las plantas de tomate tienden a arrastrarse por el suelo, lo que conlleva muchos problemas. Entutorar es la solución:\n\n*   **Frutos Más Sanos y Limpios** ✨: Al no tocar el suelo, los tomates se ensucian menos y son menos propensos a plagas y enfermedades del suelo.\n*   **Mayor Exposición Solar** ☀️: Los frutos reciben más luz, lo que acelera su maduración y mejora su calidad.\n*   **Mejor Ventilación e Iluminación** 🌬️💡: Previene enfermedades fúngicas y favorece la floración y el cuaje.\n*   **Facilita las Tareas Culturales** 🧑‍🌾: Podar, aplicar tratamientos fitosanitarios y cosechar es mucho más sencillo y eficiente.\n*   **Cosecha Más Precoz** 🚀: El mayor calor y luz directa sobre los frutos contribuyen a un adelanto en la recolección.\n\n### Tipos de Entutorado Sencillos para Empezar 🪜🏡\n\nExisten muchas formas de entutorar, pero para empezar, te recomendamos estas prácticas y efectivas:\n\n*   **Soporte Individual (Estaca o Cuerda)** 🌿\n    *   **¿En qué consiste?** Colocar una estaca (de caña, madera o hierro) junto a cada planta o tallo, o usar cuerdas que cuelgan de una estructura superior (ideal en invernaderos).\n    *   **Materiales**: Cañas, estacas, cuerdas, alambres. Para atar: esparto, rafia, plásticos o lazos prefabricados.\n    *   **Consejo práctico**: Ata el tallo a la estaca o cuerda a medida que crece, sin apretar demasiado para no estrangular la planta. Si dejas dos tallos principales, usa una cuerda o estaca para cada uno.\n\n*   **Espaldera Simple (Cañas o Alambres)** 🚧\n    *   **¿En qué consiste?** Clavar estacas o cañas verticalmente en línea (cada 2-3 metros) y luego colocar hileras horizontales de cañas o alambres a diferentes alturas (por ejemplo, a 50 cm, 1 metro y 1.5 metros del suelo). Los tallos se apoyan y atan a estas hileras.\n    *   **Ventaja**: Ofrece un buen soporte para varias plantas en línea y facilita el acceso para el manejo.\n\n## ¡Tu Cosecha de Tomates te Espera! 🚀💚\n\nRecuerda, la agricultura es una aventura de aprendizaje constante. No te desanimes si al principio no todo sale perfecto. La práctica hace al maestro. Implementa estas técnicas de poda y entutorado, observa cómo responden tus plantas y ajusta según sea necesario.\n\n¡Con paciencia, dedicación y estos consejos, estarás en camino de disfrutar de una cosecha de tomates espectacular! ¡Manos a la obra y a cultivar con pasión! 🧑‍🌾✨',NULL,'borrador',1,3,NULL,'2026-04-26 18:20:37',NULL);
INSERT INTO `blog` VALUES(4,'tomates-poda-entutorado-principiantes-guia','Tomates de Éxito: La Guía Esencial de Poda y Entutorado para Principiantes 🌱','Descubre cómo la poda y el entutorado transformarán tu cultivo de tomates. Obtén frutos más grandes, sanos y una cosecha abundante, ¡incluso si eres un agricultor principiante!','¿Sueñas con una cosecha de tomates abundante, llena de frutos rojos y perfectos, pero te sientes abrumado? ¡No estás solo! Muchos agricultores principiantes se enfrentan al desafío de mantener sus tomateras sanas y productivas. Pero tengo una gran noticia: con las técnicas correctas de poda y entutorado, puedes transformar tu cultivo y cosechar tomates de envidia. ¡Es más fácil de lo que crees!\n\n> *   **Mejora la calidad y cantidad** de tus tomates.\n> *   **Acelera la cosecha** y facilita el manejo.\n> *   **Reduce enfermedades** y plagas.\n> *   Aprende las técnicas esenciales de **poda y entutorado** para principiantes.\n\n![Imagen ilustrativa](/uploads/blog/blog_img_1777228812993_1.jpg)\n\n## ¿Por Qué Podar y Entutorar tus Tomates? 🌱 ¡El Secreto de una Cosecha Estelar!\n\nCultivar tomates de forma intensiva, ya sea en invernadero o al aire libre, requiere ciertas prácticas clave. Si las ignoras, tu producción puede caer en picado y la rentabilidad peligrar. ¡Pero no te desanimes!\n\nLa **poda** y el **entutorado** son tus aliados para guiar el crecimiento de la planta. Con ellos, limitas el número de tallos, concentrando la energía en menos frutos. Esto se traduce en una **mayor precocidad** y, sobre todo, en **frutos de mayor calidad**.\n\n## Poda: ¡Dale Forma a tu Éxito! ✂️ Más Calidad, Menos Problemas\n\nLa poda es fundamental para encauzar la energía de tu tomatera. Se divide en tres acciones principales que te ayudarán a obtener lo mejor de cada planta:\n\n#![Imagen detallada](/uploads/blog/blog_img_1777228817395_2.jpg)\n\n## Destallado (o Desbrote)\n\nConsiste en eliminar los "chupones" (brotes laterales) que nacen en las axilas de las hojas. Estos brotes compiten por nutrientes y restan vigor a los frutos principales.\n\n**Ventajas**: Consigues **tomates más grandes**, de color uniforme y más tersos. Además, facilitas el control de plagas y enfermedades. Inicia el destallado cuando los brotes tengan entre 4 y 6 cm de largo, idealmente a partir de la tercera hoja desde el primer racimo de flores.\n\n### Pinzamiento (o Despunte)\n\nEsta técnica implica cortar la yema terminal de los tallos guía. Se hace cuando la planta ha alcanzado la altura deseada o antes de una helada.\n\n**Beneficios**: Limitas la cantidad de frutos por tallo, lo que **acelera la maduración** y aumenta su tamaño. Es clave para cosechas más tempranas y para evitar pérdidas por frío o bajada de precios.\n\n### Deshojado (o Limpieza de Hojas)\n\nElimina las hojas viejas, enfermas o las que impiden la aireación y la luz. Estas hojas no aportan nada y solo consumen energía.\n\n**Impacto**: Mejora la **floración y el cuaje**, la calidad de la cosecha y **reduce la aparición de plagas y enfermedades** como la Botrytis. Hazlo con cuidado, preferiblemente por la mañana y en días secos, arrancando las hojas sin desgarrar el tallo.\n\n## Entutorado: El Soporte para un Crecimiento Fuerte ⬆️ Frutos Sanos y Limpios\n\nEl entutorado es la práctica de guiar tus plantas de tomate verticalmente. Usarás cañas, cuerdas, mallas o palos para darles el soporte necesario.\n\n**Beneficios Clave**: Los rayos solares inciden mejor en los frutos, **acelerando su maduración**. Los tratamientos fitosanitarios son más efectivos, y la planta está **mejor ventilada e iluminada**.\n\nAdemás, evitas que los frutos toquen el suelo, manteniéndolos **más sanos y limpios**, y reduciendo el ataque de plagas del suelo. ¡La recolección se vuelve mucho más cómoda!\n\n### Tipos de Tutores para Principiantes\n\n*   **Soporte Individual**: Un tutor (caña o cuerda) por cada planta o tallo principal. Es muy efectivo en invernaderos, usando cuerdas verticales desde el techo.\n*   **Espaldera**: Un sistema de estacas verticales con hilos o mallas horizontales. Es económico y muy limpio, ideal para varias plantas en línea. Las mallas prefabricadas son una excelente opción moderna.\n\n## ¡Manos a la Obra! Consejos Clave para Empezar ✨ Con Confianza\n\n¡Ahora que conoces las bases, es hora de aplicar estos conocimientos!\n\n1.  **Observa tus Plantas**: Cada tomatera es un mundo. Aprende a leer sus necesidades y ajusta la poda y el entutorado en consecuencia.\n2.  **Herramientas Limpias**: Siempre usa herramientas de poda desinfectadas para evitar la propagación de enfermedades.\n3.  **No Temas Experimentar**: Empieza con las técnicas básicas. Con el tiempo, ganarás experiencia y podrás ajustar tus métodos para optimizar tus resultados.\n4.  **La Constancia es Clave**: Realiza estas prácticas de forma regular. Un destallado a tiempo evita problemas mayores.\n\nCon estas prácticas sencillas pero poderosas, estás en el camino correcto para cultivar tomates espectaculares. ¿Listo para ver tus tomateras llenarse de frutos jugosos y deliciosos? ¡Comparte tus éxitos en los comentarios! 👇','/uploads/blog/blog_img_1777228809138_0.jpg','borrador',1,3,NULL,'2026-04-26 18:40:17',NULL);
INSERT INTO `blog` VALUES(7,'como-cultivar-calabacin-guia-esencial-agricultores-novatos','¿Cómo Cultivar Calabacín? Guía Esencial para Agricultores Novatos','Descubre los secretos para cultivar calabacín con éxito. Esta guía práctica te ofrece consejos clave para que tus primeras cosechas sean un triunfo.','{"titulo":"¿Cómo Cultivar Calabacín? Guía Esencial para Agricultores Novatos","resumen":"Descubre los secretos para cultivar calabacín con éxito. Esta guía práctica te ofrece consejos clave para que tus primeras cosechas sean un triunfo.","tags":["#Calabacín","#CultivoPrincipiantes","#HuertoUrbano","#AgriculturaSostenible","#Hortalizas"],"ficha_rapida":[{"icono":"🌡️","label":"Temp. Óptima","valor":"25-35°C"},{"icono":"🗓️","label":"Siembra","valor":"Primavera-Verano"},{"icono":"🌱","label":"Germinación","valor":"3-4 días"},{"icono":"📏","label":"Marco","valor":"100x100cm"},{"icono":"🕐","label":"Cosecha","valor":"50-60 días"},{"icono":"💧","label":"Riego","valor":"Frecuente, ligero"}],"introduccion":"¡Bienvenido, futuro agricultor! 🧑‍🌾 Cultivar tus propios calabacines es una experiencia increíblemente gratificante y más sencilla de lo que imaginas. Si estás dando tus primeros pasos en el huerto, el calabacín es tu aliado perfecto. Con su rápido crecimiento y generosa producción, te demostrará que la agricultura está al alcance de todos. Prepárate para disfrutar de la satisfacción de cosechar tus propios frutos frescos y deliciosos. ¡Vamos a sembrar éxito juntos!","secciones":[{"titulo_h2":"🌱 Conoce tu Calabacín: Exigencias y Clima Ideal","contenido_markdown":"El calabacín (*Cucurbita pepo*) es una **planta anual herbácea** de la familia de las Cucurbitáceas. Posee un tallo principal robusto y pocos secundarios, con la particularidad de emitir **raíces en los entrenudos** si contactan con tierra húmeda. Sus hojas son grandes, pelosas y ásperas, con un peciolo largo y hueco.\\n\\n### 🌡️ Temperaturas Clave para el Éxito\\n\\nEl calabacín es menos exigente en calor que otras cucurbitáceas, pero prospera con buenas temperaturas. La **temperatura óptima para la germinación** se sitúa entre **18°C y 28°C**. Por debajo de **10°C**, la germinación es difícil, y a **8°C** el crecimiento se detiene. Se hiela a **-1°C**.\\n\\nPara un **desarrollo vegetativo óptimo**, busca temperaturas entre **25°C y 35°C**. Si las bajas temperaturas duran poco y no afectan la raíz, la planta puede recuperarse. Asegúrate de que el ambiente tenga una **humedad relativa alta**, entre **65% y 80%**, y que reciba **mucha luminosidad**.\\n\\n### 🪨 Preparación del Suelo y Nutrición\\n\\nEl calabacín **no es muy exigente con el tipo de suelo**, adaptándose bien a diversas texturas. Sin embargo, su desarrollo es extraordinario en **suelos bien provistos de materia orgánica**. Una buena preparación incluye:\\n\\n*   **Labores profundas**: Un par de pases de arado y fresadora para disgregar terrones.\\n*   **Abonado de fondo**: Antes de las labores, distribuye abonos de fondo. El calabacín responde muy bien a los **estiércoles**, tanto frescos como en mantillo.\\n*   **Abonado mineral**: Es una planta muy productiva y de desarrollo rápido, por lo que demanda **fuertes cantidades de abonos minerales**. Es crucial realizar estas aportaciones de forma **fraccionada** para una asimilación eficiente. Por ejemplo, antes de sembrar, se recomiendan 300 Kg/Ha de nitrato amónico, 300 Kg/Ha de sulfato potásico y 600 Kg/Ha de superfosfato.","imagen_posicion":"derecha","imagen_ruta":"https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/blog/preparacion-del-suelo-para-sembrar-calabacin-1777640490194.webp","imagen_alt":"Manos de agricultor preparando la tierra fértil con abono orgánico para la siembra de calabacín, mostrando los primeros pasos del cultivo.","imagen_title":"Preparación del suelo para sembrar calabacín"},{"titulo_h2":"💧 Siembra y Cuidados Diarios: Tu Huerto en Marcha","contenido_markdown":"Una vez preparado el suelo, es momento de sembrar. Para obtener altos rendimientos, el suelo debe estar bien trabajado. Unos días antes de la siembra, realiza un **primer riego** para asegurar la humedad necesaria para una nascencia perfecta.\\n\\n### 🧑‍🌾 Cómo Sembrar y Plantar Correctamente\\n\\n*   **Momento ideal**: Siembra **dos o tres días después de regar**, cuando el suelo esté húmedo pero no encharcado. Espera a que las temperaturas aumenten si hace frío.\\n*   **Marcos de siembra**: Para cultivos sin asociar, planta a tresbolillo en líneas paralelas, con una separación de **1 metro entre líneas y 1 metro entre plantas**. En invernaderos, si no se entutora, amplía el marco un **50%**.\\n*   **Siembra directa**: Haz hoyos en la parte superior del caballón, coloca **3-4 semillas** por \'pie\', apriétalas suavemente y cúbrelas con **2-3 centímetros de tierra**.\\n*   **Pregerminación**: Es recomendable que las semillas estén **pregerminadas**. Se estima un gasto de **10 kg de semilla por hectárea**.\\n*   **Germinación rápida**: Con temperaturas de **14°C por la noche y 25°C por el día**, el calabacín germina en **3-4 días**.\\n\\n### 🚿 Riego y Mantenimiento Esencial\\n\\nEl riego es fundamental para el calabacín. Durante el primer mes, evita el exceso de humedad para favorecer un buen enraizamiento y un tallo recio. Una vez que la planta inicia su crecimiento rápido y empieza a fructificar (segundo o tercer fruto), se vuelve **muy exigente en agua**.\\n\\n*   **Riegos frecuentes y ligeros**: Es crucial regar a menudo, pero con **poco caudal**, evitando encharcamientos. Los riegos sucesivos se realizarán cada **3 a 5 días**, disminuyendo el turno a medida que aumentan las temperaturas y la recolección.\\n\\n### ✂️ Entutorado y Poda para Maximizar la Producción\\n\\nEstas prácticas son vitales para un cultivo sano y productivo:\\n\\n*   **Entutorado**: Altamente recomendable tanto al aire libre como en invernadero. Consiste en guiar el tallo principal atándolo a una **caña de 2 metros** o a una cuerda vertical en invernadero. Esto mejora la ventilación y la exposición solar.\\n*   **Poda**: Si la planta genera mucho follaje y tallos secundarios, pódalos en cuanto broten, **respetando siempre el tallo principal**. Los frutos de los tallos secundarios no suelen alcanzar tamaño comercial.\\n*   **Limpia de hojas**: Cuando la vegetación es muy densa, especialmente durante la recolección, elimina las **hojas más viejas** por debajo del último fruto. Esto previene enfermedades y mejora la luminosidad.\\n\\n###  harvest Cosecha Continua y de Calidad\\n\\nEl calabacín tiene un desarrollo muy rápido. Para mantener su valor comercial y estimular la producción, es aconsejable recolectar los frutos **todos los días o, como máximo, cada dos días**. El momento óptimo es cuando alcanzan un peso de **200 a 250 gramos**, una longitud de **15 a 18 centímetros** y un diámetro de **4 a 5 centímetros**. Una hectárea puede producir hasta **100.000 kilos**.","imagen_posicion":"izquierda","imagen_ruta":"https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/blog/cosecha-de-calabacin-fresco-a-mano-1777640496233.webp","imagen_alt":"Manos de agricultor recolectando un calabacín de tamaño óptimo en el huerto, destacando la frescura y la recompensa del cultivo.","imagen_title":"Cosecha de calabacín fresco a mano"}],"consejos":{"titulo":"💡 Consejos Extra para un Calabacín de Campeones","items":["**Evita el encharcamiento** — Mantén el suelo húmedo, pero sin excesos, especialmente al inicio del cultivo para un buen enraizamiento.","**Poda los tallos secundarios** — Concentrarás la energía de la planta en el fruto principal y evitarás el desarrollo excesivo de follaje.","**Cosecha a tiempo** — Recolecta cada 1-2 días frutos de 15-18 cm y 200-250 g para mantener la productividad y calidad de tu huerto.","**Nutrición fraccionada** — El calabacín es exigente; divide las aportaciones de abono mineral para asegurar un desarrollo óptimo y continuo.","**Entutora tus plantas** — Facilita la ventilación, la exposición a la luz y la recolección, mejorando la salud general de tus calabacines."]},"cta":{"titulo":"¿Listo para tu primera cosecha de calabacines?","subtitulo":"El camino del agricultor novato está lleno de satisfacciones y cosechas abundantes. ¡Anímate!","boton_primario":"🌱 ¡Empieza a cultivar ahora!","boton_secundario":"📄 Descarga nuestra guía completa"},"hero_imagen":"https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/blog/planta-de-calabacin-saludable-en-huerto-1777640482901.webp","hero_imagen_alt":"Imagen de una planta de calabacín vigorosa con frutos, ideal para inspirar a agricultores principiantes en su huerto.","hero_imagen_title":"Planta de calabacín saludable en huerto","contexto":{"tipo":"especie","nombre":"Calabacín"},"pdf_source_id":181}','uploads/blog/planta-de-calabacin-saludable-en-huerto-1777640482901.webp','borrador',1,10,NULL,'2026-05-01 13:01:18',NULL);
INSERT INTO `blog` VALUES(8,'como-cultivar-calabacin-guia-principiantes','¿Cómo Cultivar Calabacín Abundante? Guía Esencial para Principiantes','Descubre los secretos del cultivo de calabacín. Desde la siembra hasta la cosecha, esta guía te dará las claves para un huerto productivo, ¡incluso si eres principiante!','{"titulo":"¿Cómo Cultivar Calabacín Abundante? Guía Esencial para Principiantes","resumen":"Descubre los secretos del cultivo de calabacín. Desde la siembra hasta la cosecha, esta guía te dará las claves para un huerto productivo, ¡incluso si eres principiante!","tags":["#Calabacín","#HuertoPrincipiante","#CultivoSostenible","#VerdurasFrescas"],"ficha_rapida":[{"icono":"🌡️","label":"Temp. Óptima","valor":"25-35°C"},{"icono":"🗓️","label":"Siembra","valor":"Primavera-Verano"},{"icono":"🌱","label":"Germinación","valor":"3-4 días"},{"icono":"📏","label":"Marco","valor":"1x1m"},{"icono":"🕐","label":"Cosecha","valor":"50-60 días"},{"icono":"💧","label":"Riego","valor":"Frecuente, ligero"}],"introduccion":"Soñar con un huerto lleno de calabacines frescos y deliciosos es el primer paso para todo agricultor principiante. 🌱 Esta hortaliza, versátil y agradecida, puede transformar tu jardín en una fuente de abundancia. No te dejes intimidar por la idea de empezar; con esta guía, aprenderás a cultivar calabacín con éxito, disfrutando del proceso y de una cosecha espectacular. ¡Prepárate para ver crecer tus primeros frutos y saborear la recompensa de tu esfuerzo!","secciones":[{"titulo_h2":"🌱 Preparando el Terreno y la Siembra Perfecta","contenido_markdown":"### ☀️ Clima y Suelo: La Base del Éxito\\nEl calabacín, **Cucurbita pepo**, es una planta anual que te sorprenderá por su vigor. Aunque es menos exigente en calor que sus parientes como el melón, necesita temperaturas estables. Se hiela a **-1°C** y detiene su crecimiento a **8°C**, así que planifica bien.\\n\\nPara una germinación óptima, el suelo debe estar entre **18-28°C**, con un mínimo de **10°C**. El desarrollo ideal de la planta se da entre **25-35°C**. ¡Asegúrate de que tu huerto esté listo para recibir este calor!\\n\\nRespecto al suelo, el calabacín no es excesivamente caprichoso, pero te lo agradecerá si está **bien provisto de materia orgánica**. Admite todo tipo de terrenos, siempre que disponga de **humedad adecuada y buena luminosidad**.\\n\\n### 🛠️ Preparación del Terreno y Siembra\\nUna buena preparación del suelo es fundamental. Realiza labores profundas con vertedera y luego un pase de fresadora para **disgregar los terrones**. Esto asegura un lecho de siembra óptimo para las raíces.\\n\\nAntes de las labores, es el momento de distribuir los **abonos de fondo**. Forma **caballones robustos**, separados por **1 metro entre ejes**. Unos días antes de sembrar, aplica un riego generoso para que el suelo tenga la humedad perfecta para la nascencia.\\n\\nLa siembra se realiza **2 o 3 días después de este riego**. Abre hoyos en la parte superior del caballón, donde la tierra esté húmeda. Coloca **3 o 4 semillas** por \\"pie\\", presiónalas suavemente y cúbrelas con **2-3 cm de tierra**.\\n\\nPara acelerar el proceso, se recomienda usar **semillas pregerminadas**. Con temperaturas de **14°C por la noche** y **25°C por el día**, tus calabacines brotarán en tan solo **3-4 días**. Si siembras sin asociar, un marco de **1 metro entre líneas** y **1 metro entre plantas** es ideal.","imagen_posicion":"derecha","imagen_ruta":"https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/blog/preparacion-del-suelo-para-calabacin-1777641002659.webp","imagen_alt":"Suelo bien preparado con caballones listos para la siembra de calabacín, mostrando la importancia de la materia orgánica.","imagen_title":"Preparación del suelo para calabacín"},{"titulo_h2":"💧 Cuidado y Mantenimiento para una Cosecha Abundante","contenido_markdown":"### 💧 Riego, Abono y Entutorado: Pilares del Cuidado\\nEl calabacín es una planta muy exigente en agua, especialmente durante su fase de crecimiento rápido y la fructificación. Los **riegos deben ser frecuentes, pero de caudal ligero**, evitando siempre el encharcamiento. Durante el primer mes tras la siembra, modera el riego para fomentar un **fuerte enraizamiento**. A partir del segundo riego, cuando los primeros frutos asoman, y a medida que las temperaturas suben y la planta produce, riega cada **3-5 días**.\\n\\nDado su rápido desarrollo y alta productividad, el calabacín demanda **fuertes cantidades de abonos minerales**. Es crucial que estos se aporten de forma **fraccionada** a lo largo del ciclo de cultivo para asegurar una nutrición constante.\\n\\nCuando la planta tenga **3 o 4 hojas**, realiza un aporcado ligero para romper la costra del suelo y eliminar hierbas. A medida que crece, continúa aporcando hasta que las plantas queden bien asentadas en el caballón.\\n\\nEl **entutorado** es una práctica muy beneficiosa. Consiste en guiar el tallo principal atándolo a una **caña de 2 metros** o a una cuerda si cultivas en invernadero. Esto mejora la aireación de la planta y facilita la recolección, previniendo enfermedades.\\n\\n### ✂️ Poda, Limpia y Cosecha Estratégica\\nSi tu planta de calabacín desarrolla muchos tallos secundarios (ahijados), es aconsejable **podarlos en cuanto broten**, dejando siempre el tallo principal. Los frutos de los tallos secundarios no suelen alcanzar un tamaño comercial óptimo.\\n\\nUna **limpia de hojas** también es importante si la vegetación se vuelve muy densa. Corta las hojas más viejas, siempre por debajo del último fruto y en la unión con el tallo. Esto mejora la luminosidad y reduce el riesgo de enfermedades.\\n\\nFinalmente, ¡la recompensa! La recolección del calabacín es clave para su valor comercial. Debido a su rápido crecimiento, debes recolectar **todos los días o, como máximo, cada dos días**. El tamaño ideal para la cosecha es cuando el fruto pesa entre **200-250 gramos**, mide **15-18 cm de largo** y tiene **4-5 cm de diámetro**. ¡Un huerto bien cuidado puede producir hasta **100.000 kg por hectárea**!","imagen_posicion":"izquierda","imagen_ruta":"https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/blog/calabacin-entutorado-y-productivo-1777641009707.webp","imagen_alt":"Planta de calabacín sana y entutorada, mostrando frutos en desarrollo y la técnica de guiado para un cultivo óptimo.","imagen_title":"Calabacín entutorado y productivo"}],"consejos":{"titulo":"💡 Consejos de Agrónomo para tu Calabacín","items":["**Control de Temp.** — Mantén el suelo por encima de **10°C** para una germinación exitosa y protege tus plantas de heladas bajo **-1°C**.","**Abono Fraccionado** — Divide la aplicación de abonos minerales en varias dosis a lo largo del ciclo para una nutrición constante y efectiva.","**Riego Inteligente** — Riega **frecuentemente y con poca cantidad**, evitando encharcamientos, especialmente en las primeras etapas de crecimiento.","**Cosecha Diaria** — Recolecta tus calabacines **cada 1 o 2 días** cuando tengan **15-18 cm**, así fomentas nueva producción y aseguras la calidad.","**Entutorado es Clave** — Guía tus plantas con una **caña de 2m** o cuerda para mejorar la aireación, prevenir enfermedades y facilitar la cosecha."]},"cta":{"titulo":"¿Listo para cosechar tus propios calabacines?","subtitulo":"Tu huerto te espera, ¡manos a la tierra!","boton_primario":"🌱 Empezar mi cultivo ahora","boton_secundario":"📄 Descargar guía completa"},"hero_imagen":"https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/blog/calabacin-fresco-en-el-huerto-1777640996054.webp","hero_imagen_alt":"Imagen de calabacines creciendo sanos en un huerto moderno, lista para ser cosechada por un agricultor.","hero_imagen_title":"Calabacín fresco en el huerto","contexto":{"tipo":"especie","nombre":"Calabacín"},"pdf_source_id":181}','uploads/blog/calabacin-fresco-en-el-huerto-1777640996054.webp','borrador',1,10,NULL,'2026-05-01 13:09:51',NULL);
INSERT INTO `blog` VALUES(9,'como-cultivar-calabacin-guia-esencial-agricultores-principiantes','¿Cómo Cultivar Calabacín? Guía Esencial para Agricultores Principiantes','Descubre los secretos para cultivar calabacín con éxito, desde la siembra hasta la cosecha.\nConsejos prácticos para principiantes que buscan resultados abundantes.','{"titulo":"¿Cómo Cultivar Calabacín? Guía Esencial para Agricultores Principiantes","resumen":"Descubre los secretos para cultivar calabacín con éxito, desde la siembra hasta la cosecha.\\nConsejos prácticos para principiantes que buscan resultados abundantes.","tags":["#Calabacin","#CultivoEcologico","#HuertoEnCasa","#AgriculturaPrincipiante","#Hortalizas"],"ficha_rapida":[{"icono":"🌡️","label":"Temp. Óptima","valor":"18-35°C"},{"icono":"🗓️","label":"Siembra","valor":"Primavera-Verano"},{"icono":"🌱","label":"Germinación","valor":"3-4 días"},{"icono":"📏","label":"Marco","valor":"1x1m"},{"icono":"🕐","label":"Cosecha","valor":"50-60 días"},{"icono":"💧","label":"Riego","valor":"Frecuente y Ligero"}],"introduccion":"¡Hola, futuros agricultores! ¿Listos para añadir una hortaliza versátil y productiva a vuestro huerto? El calabacín es una elección fantástica para empezar.\\nCon un crecimiento rápido y generosas cosechas, te brindará una satisfacción inmensa. Prepárate para transformar tu jardín en un oasis de sabor y abundancia. ¡Vamos a cultivar!","secciones":[{"titulo_h2":"🌱 El Secreto de un Buen Inicio: Clima y Suelo Ideal","contenido_markdown":"Para que tu calabacín prospere, comprender sus **exigencias climáticas** es fundamental. Es una planta que ama el calor, con una temperatura óptima de desarrollo entre **25°C y 35°C**.\\nLa germinación ideal se da entre **18°C y 28°C**, siendo difícil por debajo de 10°C. Ten en cuenta que se detiene su crecimiento a 8°C y se hiela a -1°C. ¡Protege tus plantas del frío extremo!\\n\\n### 🌍 Preparando el Terreno Perfecto\\nEl calabacín no es muy exigente con el **tipo de suelo**, adaptándose a casi todos. Sin embargo, prefiere terrenos bien provistos de **materia orgánica**.\\nUn suelo rico y con buena capacidad de retención de humedad, pero sin encharcamientos, es su paraíso. Asegúrate de que tu terreno tenga una **humedad relativa alta**, entre el 65% y 80%.\\n\\n### 💧 Riego y Nutrición Esenciales\\nDurante el primer mes tras la siembra, evita el exceso de humedad para favorecer un **enraizamiento fuerte** y un tallo recio. Después, con el inicio del crecimiento rápido y la fructificación, el calabacín se vuelve muy exigente en agua.\\nDeberás realizar **riegos frecuentes y ligeros**, evitando siempre el encharcamiento que podría dañar las raíces. En cuanto a la nutrición, esta hortaliza es muy productiva y de rápido desarrollo, por lo que demanda **abundantes abonos minerales**.\\nEs crucial aplicar estos abonos de forma **fraccionada** a lo largo del cultivo para asegurar un suministro constante de nutrientes. Un suelo bien nutrido y un riego adecuado son la base para una cosecha exitosa.","imagen_posicion":"derecha","imagen_ruta":"https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/blog/calabacin-raices-en-suelo-fertil-1777641682619.webp","imagen_alt":"Detalle de una planta de calabacín con raíces robustas en un suelo rico y bien preparado, simbolizando un buen inicio de cultivo.","imagen_title":"Calabacín: Raíces en Suelo Fértil"},{"titulo_h2":"🌿 De la Semilla al Fruto: Siembra, Cuidado y Entutorado","contenido_markdown":"El primer paso para una cosecha exitosa es una **siembra adecuada**. Prepara el suelo con labores de arado y fresado para disgregar los terrones, y distribuye los abonos de fondo antes de sembrar.\\nUnos días antes de la siembra, riega el terreno para asegurar la humedad necesaria para una buena nascencia. La siembra se realiza **2 o 3 días después de este riego**.\\n\\n### 📏 Siembra y Marcos de Plantación\\nSi siembras directamente, haz hoyos en la parte superior del caballón, donde la tierra esté húmeda. Coloca **3 o 4 semillas por \\"pie\\"** y cúbrelas con **2 o 3 centímetros de tierra**.\\nEs recomendable que las semillas estén **pregerminadas** para acelerar el proceso. Para un cultivo sin asociar, el marco de siembra ideal es de **1 metro entre líneas y 1 metro entre plantas**.\\n\\n### 🧤 Cuidados Esenciales para el Desarrollo\\nCuando la planta tenga 3 o 4 hojas, realiza una **cava ligera** para romper la costra del riego. A medida que crece, **aporca** las plantas hasta lo alto del caballón. Si observas la tierra apelmazada o con hierbas, realiza labores de escarda.\\nEl **entutorado** es muy recomendable; ayuda a la planta a crecer verticalmente, facilitando la ventilación y la cosecha. Utiliza cañas de **unos 2 metros** y ata el tallo principal a medida que crece. En invernaderos, puedes usar cuerdas verticales.\\n\\n### ✂️ Poda y Limpia de Hojas\\nSi tu calabacín desarrolla mucho follaje y tallos secundarios, es aconsejable **podarlos** en cuanto broten, respetando siempre el tallo principal. Esto asegura que la energía de la planta se concentre en producir frutos de tamaño comercial.\\nLa **limpia de hojas** viejas o enfermas, especialmente si la vegetación es muy exuberante, mejora la luminosidad y previene enfermedades. Corta siempre por debajo del último fruto y en la unión del peciolo con el tallo.","imagen_posicion":"izquierda","imagen_ruta":"https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/blog/entutorado-del-calabacin-soporte-para-el-crecimiento-1777641691005.webp","imagen_alt":"Manos atando una planta joven de calabacín a un tutor de madera, ilustrando el cuidado y soporte necesarios para su desarrollo.","imagen_title":"Entutorado del Calabacín: Soporte para el Crecimiento"},{"titulo_h2":"💪 Cosecha Abundante y Desafíos Comunes: Plagas y Enfermedades","contenido_markdown":"¡Llegó el momento más gratificante! La **recolección del calabacín** es un proceso rápido y constante. Para asegurar su valor comercial, es crucial cosechar los frutos cuando alcanzan el tamaño ideal: entre **15 y 18 cm de largo** y **4 a 5 cm de diámetro**, con un peso de **200 a 250 gramos**.\\nRecolecta **todos los días o, como máximo, cada dos días** para estimular la producción continua y evitar que los frutos se hagan demasiado grandes y fibrosos. Una hectárea puede producir hasta **100.000 kg**.\\n\\n### 🛡️ Protegiendo Tu Cosecha: Plagas y Enfermedades\\nEl calabacín, aunque resistente, puede verse afectado por algunas plagas y enfermedades comunes. Esté atento a señales de **Oídio**, que se manifiesta como manchas blancas pulverulentas en las hojas, y a la **Botrytis**, que ataca los frutos recién cuajados con manchas grises húmedas.\\nLas **Virosis**, propagadas por semillas e insectos como los pulgones, pueden causar hojas abarquilladas y frutos deformes. No hay cura directa, pero el uso de **variedades resistentes** y el **control de pulgones** son clave.\\n\\n### 🕷️ Control de Plagas Comunes\\nLos **pulgones** son chupadores de savia que debilitan la planta. Combátelos con insecticidas sistémicos o de contacto, pero siempre con precaución, dado que la recolección es diaria. Realiza tratamientos preventivos antes de que la cosecha sea intensiva.\\nLa **araña roja** es otra plaga a vigilar; causa un bronceado en las hojas y puede generar telarañas en el envés. Un control temprano con **acaricidas totales** es vital para evitar su propagación y la defoliación de la planta. La **prevención** y la **observación constante** son tus mejores aliados para mantener tu cultivo sano y productivo.","imagen_posicion":"derecha"}],"consejos":{"titulo":"💡 Consejos Extra para tu Calabacín","items":["**Riego constante** — Asegura un suministro regular de agua, especialmente en fructificación, para frutos jugosos.","**Poda temprana** — Elimina tallos secundarios a tiempo para concentrar la energía en el tallo principal y frutos de calidad.","**Revisión diaria** — Cosecha los calabacines jóvenes para fomentar una producción continua y evitar que se pasen.","**Suelo enriquecido** — Incorpora compost o estiércol maduro antes de la siembra para una base nutritiva sólida.","**Entutorado** — Soporta tus plantas para mejorar la aireación, prevenir enfermedades y facilitar la recolección."]},"cta":{"titulo":"¿Listo para ver crecer tus propios calabacines?","subtitulo":"¡Empieza hoy tu aventura agrícola y disfruta de la recompensa de tu esfuerzo!","boton_primario":"🌱 ¡Quiero mi huerto de calabacines!","boton_secundario":"📄 Descargar guía de plagas"},"hero_imagen":"https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/blog/cultivo-de-calabacin-amanecer-en-el-huerto-1777641676126.webp","hero_imagen_alt":"Imagen de un campo de calabacines bajo la luz del amanecer, con un agricultor inspeccionando la cosecha. Ideal para principiantes.","hero_imagen_title":"Cultivo de Calabacín: Amanecer en el Huerto","contexto":{"tipo":"especie","nombre":"Calabacín"},"pdf_source_id":181}','uploads/blog/cultivo-de-calabacin-amanecer-en-el-huerto-1777641676126.webp','borrador',1,10,NULL,'2026-05-01 13:21:12',NULL);
INSERT INTO `blog` VALUES(10,'cultivar-calabacin-guia-principiantes','¿Cómo Cultivar Calabacín? Guía Esencial para Principiantes 🌱','Descubre cómo cultivar calabacín en tu huerto con esta guía práctica para agricultores novatos. Aprende desde la siembra hasta la cosecha para obtener frutos abundantes.','{"titulo":"¿Cómo Cultivar Calabacín? Guía Esencial para Principiantes 🌱","resumen":"Descubre cómo cultivar calabacín en tu huerto con esta guía práctica para agricultores novatos. Aprende desde la siembra hasta la cosecha para obtener frutos abundantes.","tags":["#Calabacín","#HuertoPrincipiantes","#CultivoHortalizas","#AgriculturaUrbana"],"ficha_rapida":[{"icono":"🌡️","label":"Temp. Óptima","valor":"25-35°C"},{"icono":"🗓️","label":"Siembra","valor":"Primavera-Verano"},{"icono":"🌱","label":"Germinación","valor":"3-4 días"},{"icono":"📏","label":"Marco","valor":"100x100cm"},{"icono":"🕐","label":"Cosecha","valor":"50-60 días"},{"icono":"💧","label":"Riego","valor":"Frecuente, ligero"}],"introduccion":"¡Anímate a cultivar calabacín! Esta hortaliza, fácil y productiva, es perfecta para iniciarte en el huerto. Con unos pocos cuidados, pronto disfrutarás de sus deliciosos frutos frescos. Prepárate para ver crecer tu huerto y saborear el éxito de tu esfuerzo. ¡Es hora de ensuciarse las manos y cosechar tus propios calabacines!","secciones":[{"titulo_h2":"☀️ Conoce las Exigencias Climatológicas y del Suelo","contenido_markdown":"El calabacín, conocido científicamente como **Cucurbita pepo**, es una planta anual herbácea que sorprende por su adaptabilidad. Es menos exigente en calor que otras cucurbitáceas, pero responde maravillosamente a temperaturas elevadas.\\n\\n### 🌡️ Temperaturas Ideales\\nLa **temperatura óptima** para su desarrollo oscila entre **25 y 35°C**. El crecimiento se detiene a los **8°C** y se hiela por debajo de **-1°C**. Para una germinación exitosa, el suelo debe estar entre **18 y 28°C**.\\n\\n### 💧 Humedad y Luz\\nEsta planta necesita una **humedad relativa alta**, idealmente entre el **65 y 80%**. Además, el calabacín es un amante del sol, requiriendo **bastante luminosidad** para un crecimiento vigoroso y una buena producción de frutos.\\n\\n### 🌱 El Suelo Perfecto\\nAunque no es excesivamente exigente, el calabacín prefiere **suelos bien provistos de materia orgánica**. Responde excepcionalmente a los **estiércoles**, ya sean frescos o convertidos en mantillo. Un suelo rico y bien drenado es clave.\\n\\n### 🧪 Nutrición Esencial\\nDebido a su rápido desarrollo y alta productividad, el calabacín demanda **fuertes cantidades de abonos minerales**. Es fundamental realizar la aportación de abonos de forma **fraccionada** para asegurar una nutrición constante y equilibrada durante todo su ciclo de cultivo.","imagen_posicion":"derecha","imagen_ruta":"https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/blog/semillero-de-calabacin-en-tierra-fertil-1777748361806.webp","imagen_alt":"Primer plano de una joven planta de calabacín brotando en suelo orgánico y bien preparado, bajo luz natural.","imagen_title":"Semillero de calabacín en tierra fértil"},{"titulo_h2":"🛠️ Siembra, Riego y Cuidados para una Cosecha Abundante","contenido_markdown":"Una buena preparación y un seguimiento constante son la clave para un cultivo de calabacín exitoso. Con estos pasos sencillos, verás cómo tu huerto prospera.\\n\\n### 🥕 Preparación del Terreno\\nAntes de sembrar, prepara el suelo con labores de **vertedera** y un pase de **fresadora** para desmenuzar los terrones. Forma **caballones** robustos, separados por **un metro** entre ejes. Distribuye abonos de fondo antes de estas labores.\\n\\n### 🗓️ Siembra Directa y Marco\\nUnos días antes de la siembra, realiza un riego para asegurar la humedad. Siembra **2 o 3 días** después, colocando **3 o 4 semillas** pregerminadas por hoyo, a **2-3 cm** de profundidad. El marco de plantación ideal es de **100x100 cm**.\\n\\n### 💧 Riego Inteligente\\nDurante el primer mes post-siembra, evita el exceso de humedad. El **primer riego** se hace antes de sembrar; el **segundo**, al mes y medio, cuando aparezcan los primeros frutos. Luego, riega **cada 3-5 días**, de forma **frecuente pero ligera**, sin encharcar el suelo.\\n\\n### 🧑‍🌾 Labores Culturales\\n*   **Aporcado y Escarda**: Cuando la planta tenga 3-4 hojas, rompe la costra superficial. Aporca a medida que crece. Escarda si el suelo se apelmaza o aparecen hierbas.\\n*   **Entutorado**: Es muy recomendable. Usa cañas de **2 metros** o cuerdas en invernadero para guiar el tallo principal. Esto mejora la aireación y facilita la cosecha.\\n*   **Poda**: Elimina los tallos secundarios en cuanto broten, siempre respetando el tallo principal. Esto asegura frutos de mayor calidad y tamaño comercial.\\n*   **Limpia de Hojas**: Retira las hojas más viejas, especialmente si la vegetación es muy densa. Hazlo por debajo del último fruto, en la unión con el tallo. Esto mejora la luz y previene enfermedades.\\n\\n### 🥒 Cosecha Constante\\nEl calabacín crece muy rápido. Para mantener su valor comercial, recolecta los frutos **todos los días o cada dos días**. El tamaño óptimo es de **15-18 cm** de largo, **4-5 cm** de diámetro y un peso de **200-250 gramos**.","imagen_posicion":"izquierda","imagen_ruta":"https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/blog/siembra-manual-de-semillas-de-calabacin-1777748367089.webp","imagen_alt":"Manos de jardinero sembrando semillas de calabacín en un bancal preparado, mostrando cuidado y técnica.","imagen_title":"Siembra manual de semillas de calabacín"}],"consejos":{"titulo":"💡 Secretos para un Calabacín de Éxito","items":["**Cosecha frecuente** — Recolecta cada 1-2 días para estimular la producción y evitar frutos gigantes.","**Riego constante** — Mantén el suelo húmedo, pero nunca encharcado, especialmente durante la floración y fructificación.","**Materia orgánica** — Enriquece tu suelo con compost o estiércol para una planta más sana y productiva.","**Entutorado temprano** — Guía el tallo principal desde joven para mejorar la aireación y facilitar la recolección."]},"cta":{"titulo":"¿Listo para tu Cosecha de Calabacín?","subtitulo":"¡Anímate a cultivar tus propios vegetales frescos y disfruta del proceso!","boton_primario":"🌱 ¡Empieza tu Huerto Hoy!","boton_secundario":"📄 Descarga la Guía Completa"},"hero_imagen":"https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/blog/calabacin-saludable-en-huerto-soleado-1777748353456.webp","hero_imagen_alt":"Imagen de una planta de calabacín vigorosa con frutos verdes listos para cosechar en un huerto al aire libre.","hero_imagen_title":"Calabacín saludable en huerto soleado","contexto":{"tipo":"especie","nombre":"Calabacín"},"pdf_source_id":181}','uploads/blog/calabacin-saludable-en-huerto-soleado-1777748353456.webp','borrador',1,10,NULL,'2026-05-02 18:59:09',NULL);

DROP TABLE IF EXISTS `chatconversaciones`;
CREATE TABLE `chatconversaciones` (
  `idchatconversaciones` int NOT NULL AUTO_INCREMENT,
  `chatconversacionestipo` enum('directo','soporte','grupo') COLLATE utf8mb4_unicode_ci NOT NULL,
  `chatconversacionesnombre` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chatconversacionesdescripcion` text COLLATE utf8mb4_unicode_ci,
  `xchatconversacionesidusuariocreador` int NOT NULL,
  `chatconversacionesclaveunica` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chatconversacionesactivosino` tinyint(1) NOT NULL DEFAULT '1',
  `chatconversacionesfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `chatconversacionesfechaactualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idchatconversaciones`),
  UNIQUE KEY `uq_chatconv_clave` (`chatconversacionesclaveunica`),
  KEY `idx_chatconv_tipo` (`chatconversacionestipo`),
  KEY `idx_chatconv_actualizacion` (`chatconversacionesfechaactualizacion`),
  KEY `idx_chatconv_creador` (`xchatconversacionesidusuariocreador`),
  CONSTRAINT `fk_chatconv_creator` FOREIGN KEY (`xchatconversacionesidusuariocreador`) REFERENCES `usuarios` (`idusuarios`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `chatconversaciones` VALUES(1,'soporte',NULL,NULL,2,'soporte:1:2',1,'2026-04-20 09:39:30','2026-04-22 13:43:57');
INSERT INTO `chatconversaciones` VALUES(2,'grupo','Comunidad Verdantia','Canal general para dudas, ayuda y conversaci+',1,'grupo:comunidad:general',1,'2026-04-20 09:44:01','2026-04-20 09:52:25');
INSERT INTO `chatconversaciones` VALUES(3,'grupo','Tomatera',NULL,1,NULL,1,'2026-04-20 09:44:39','2026-04-20 09:44:39');
INSERT INTO `chatconversaciones` VALUES(4,'directo',NULL,NULL,2,'directo:2:14',1,'2026-04-22 12:17:41','2026-04-22 12:17:41');
INSERT INTO `chatconversaciones` VALUES(5,'directo',NULL,NULL,2,'directo:1:2',1,'2026-04-22 13:43:29','2026-04-22 14:56:18');
INSERT INTO `chatconversaciones` VALUES(6,'directo',NULL,NULL,1,'directo:1:4',1,'2026-04-22 15:43:06','2026-04-22 15:43:06');
INSERT INTO `chatconversaciones` VALUES(7,'directo',NULL,NULL,1,'directo:1:3',1,'2026-04-22 16:28:56','2026-04-22 16:28:56');

DROP TABLE IF EXISTS `chatconversacionesusuarios`;
CREATE TABLE `chatconversacionesusuarios` (
  `idchatconversacionesusuarios` int NOT NULL AUTO_INCREMENT,
  `xchatconversacionesusuariosidchatconversaciones` int NOT NULL,
  `xchatconversacionesusuariosidusuarios` int NOT NULL,
  `chatconversacionesusuariosrol` enum('miembro','admin_grupo','admin_soporte') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'miembro',
  `chatconversacionesusuariosultimalecturaidchatmensajes` int DEFAULT NULL,
  `chatconversacionesusuariosactivosino` tinyint(1) NOT NULL DEFAULT '1',
  `chatconversacionesusuariosfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `chatconversacionesusuariosfechaactualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idchatconversacionesusuarios`),
  UNIQUE KEY `uq_chatconv_user` (`xchatconversacionesusuariosidchatconversaciones`,`xchatconversacionesusuariosidusuarios`),
  KEY `idx_chatmem_user` (`xchatconversacionesusuariosidusuarios`),
  KEY `idx_chatmem_activo` (`chatconversacionesusuariosactivosino`),
  KEY `idx_chatmem_ultimalectura` (`chatconversacionesusuariosultimalecturaidchatmensajes`),
  CONSTRAINT `fk_chatmem_conv` FOREIGN KEY (`xchatconversacionesusuariosidchatconversaciones`) REFERENCES `chatconversaciones` (`idchatconversaciones`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chatmem_lastread` FOREIGN KEY (`chatconversacionesusuariosultimalecturaidchatmensajes`) REFERENCES `chatmensajes` (`idchatmensajes`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_chatmem_user` FOREIGN KEY (`xchatconversacionesusuariosidusuarios`) REFERENCES `usuarios` (`idusuarios`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `chatconversacionesusuarios` VALUES(1,1,2,'miembro',11,1,'2026-04-20 09:39:30','2026-04-22 13:43:57');
INSERT INTO `chatconversacionesusuarios` VALUES(2,1,1,'admin_soporte',11,1,'2026-04-20 09:39:30','2026-04-22 15:42:55');
INSERT INTO `chatconversacionesusuarios` VALUES(3,2,1,'admin_grupo',6,1,'2026-04-20 09:44:01','2026-04-20 09:52:25');
INSERT INTO `chatconversacionesusuarios` VALUES(4,2,2,'miembro',6,1,'2026-04-20 09:44:01','2026-04-22 16:31:21');
INSERT INTO `chatconversacionesusuarios` VALUES(5,2,3,'miembro',NULL,1,'2026-04-20 09:44:01','2026-04-22 16:31:21');
INSERT INTO `chatconversacionesusuarios` VALUES(6,2,4,'miembro',NULL,1,'2026-04-20 09:44:01','2026-04-22 16:31:21');
INSERT INTO `chatconversacionesusuarios` VALUES(7,2,5,'miembro',NULL,1,'2026-04-20 09:44:01','2026-04-22 16:31:21');
INSERT INTO `chatconversacionesusuarios` VALUES(8,2,6,'miembro',NULL,1,'2026-04-20 09:44:01','2026-04-22 16:31:21');
INSERT INTO `chatconversacionesusuarios` VALUES(9,2,7,'miembro',NULL,1,'2026-04-20 09:44:01','2026-04-22 16:31:21');
INSERT INTO `chatconversacionesusuarios` VALUES(10,2,8,'miembro',NULL,1,'2026-04-20 09:44:01','2026-04-22 16:31:21');
INSERT INTO `chatconversacionesusuarios` VALUES(11,2,9,'miembro',NULL,1,'2026-04-20 09:44:01','2026-04-22 16:31:21');
INSERT INTO `chatconversacionesusuarios` VALUES(12,2,10,'miembro',NULL,1,'2026-04-20 09:44:01','2026-04-22 16:31:21');
INSERT INTO `chatconversacionesusuarios` VALUES(13,2,11,'miembro',NULL,1,'2026-04-20 09:44:01','2026-04-22 16:31:21');
INSERT INTO `chatconversacionesusuarios` VALUES(14,2,12,'miembro',NULL,1,'2026-04-20 09:44:01','2026-04-22 16:31:21');
INSERT INTO `chatconversacionesusuarios` VALUES(15,2,13,'miembro',NULL,1,'2026-04-20 09:44:01','2026-04-22 16:31:21');
INSERT INTO `chatconversacionesusuarios` VALUES(16,2,14,'miembro',NULL,1,'2026-04-20 09:44:01','2026-04-22 16:31:21');
INSERT INTO `chatconversacionesusuarios` VALUES(17,3,1,'admin_grupo',NULL,1,'2026-04-20 09:44:39','2026-04-20 09:44:39');
INSERT INTO `chatconversacionesusuarios` VALUES(46,4,2,'miembro',7,1,'2026-04-22 12:17:41','2026-04-22 12:17:41');
INSERT INTO `chatconversacionesusuarios` VALUES(47,4,14,'miembro',NULL,1,'2026-04-22 12:17:41','2026-04-22 12:17:41');
INSERT INTO `chatconversacionesusuarios` VALUES(48,5,2,'miembro',24,1,'2026-04-22 13:43:29','2026-04-22 14:46:38');
INSERT INTO `chatconversacionesusuarios` VALUES(49,5,1,'miembro',25,1,'2026-04-22 13:43:29','2026-04-22 14:56:18');
INSERT INTO `chatconversacionesusuarios` VALUES(72,6,1,'miembro',26,1,'2026-04-22 15:43:06','2026-04-22 15:43:06');
INSERT INTO `chatconversacionesusuarios` VALUES(73,6,4,'miembro',NULL,1,'2026-04-22 15:43:06','2026-04-22 15:43:06');
INSERT INTO `chatconversacionesusuarios` VALUES(74,7,1,'miembro',27,1,'2026-04-22 16:28:56','2026-04-22 16:28:56');
INSERT INTO `chatconversacionesusuarios` VALUES(75,7,3,'miembro',NULL,1,'2026-04-22 16:28:56','2026-04-22 16:28:56');

DROP TABLE IF EXISTS `chatinvitaciones`;
CREATE TABLE `chatinvitaciones` (
  `idchatinvitaciones` int NOT NULL AUTO_INCREMENT,
  `xchatinvitacionesidchatconversaciones` int NOT NULL,
  `xchatinvitacionesidemisor` int NOT NULL,
  `xchatinvitacionesidreceptor` int NOT NULL,
  `chatinvitacionesestado` enum('pendiente','aceptada','rechazada','cancelada','expirada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `chatinvitacionesmensaje` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chatinvitacionesfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `chatinvitacionesfecharespuesta` timestamp NULL DEFAULT NULL,
  `chatinvitacionesfechaexpiracion` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`idchatinvitaciones`),
  KEY `idx_chatinv_conv_estado` (`xchatinvitacionesidchatconversaciones`,`chatinvitacionesestado`),
  KEY `idx_chatinv_receptor_estado` (`xchatinvitacionesidreceptor`,`chatinvitacionesestado`),
  KEY `idx_chatinv_emisor` (`xchatinvitacionesidemisor`),
  CONSTRAINT `fk_chatinv_conv` FOREIGN KEY (`xchatinvitacionesidchatconversaciones`) REFERENCES `chatconversaciones` (`idchatconversaciones`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chatinv_emisor` FOREIGN KEY (`xchatinvitacionesidemisor`) REFERENCES `usuarios` (`idusuarios`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chatinv_receptor` FOREIGN KEY (`xchatinvitacionesidreceptor`) REFERENCES `usuarios` (`idusuarios`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `chatinvitaciones` VALUES(1,3,1,5,'pendiente','Invitaci+','2026-04-20 09:44:49',NULL,'2026-05-04 09:44:49');

DROP TABLE IF EXISTS `chatmensajes`;
CREATE TABLE `chatmensajes` (
  `idchatmensajes` int NOT NULL AUTO_INCREMENT,
  `xchatmensajesidchatconversaciones` int NOT NULL,
  `xchatmensajesidusuarios` int DEFAULT NULL,
  `chatmensajestipo` enum('texto','imagen','archivo','sistema') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'texto',
  `chatmensajestexto` mediumtext COLLATE utf8mb4_unicode_ci,
  `xchatmensajesidmensajerespuesta` int DEFAULT NULL,
  `chatmensajeseditadosino` tinyint(1) NOT NULL DEFAULT '0',
  `chatmensajeseliminadosino` tinyint(1) NOT NULL DEFAULT '0',
  `chatmensajesfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `chatmensajesfechaedicion` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`idchatmensajes`),
  KEY `idx_chatmsg_conv_fecha` (`xchatmensajesidchatconversaciones`,`chatmensajesfechacreacion`),
  KEY `idx_chatmsg_user` (`xchatmensajesidusuarios`),
  KEY `idx_chatmsg_reply` (`xchatmensajesidmensajerespuesta`),
  CONSTRAINT `fk_chatmsg_conv` FOREIGN KEY (`xchatmensajesidchatconversaciones`) REFERENCES `chatconversaciones` (`idchatconversaciones`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chatmsg_reply` FOREIGN KEY (`xchatmensajesidmensajerespuesta`) REFERENCES `chatmensajes` (`idchatmensajes`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_chatmsg_user` FOREIGN KEY (`xchatmensajesidusuarios`) REFERENCES `usuarios` (`idusuarios`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `chatmensajes` VALUES(1,1,2,'texto','Nueva consulta de soporte iniciada.',NULL,0,0,'2026-04-20 09:39:30',NULL);
INSERT INTO `chatmensajes` VALUES(2,1,2,'texto','Hola como va todo ?',NULL,0,0,'2026-04-20 09:39:42',NULL);
INSERT INTO `chatmensajes` VALUES(3,1,1,'texto','hola pedro gracias por estar',NULL,0,0,'2026-04-20 09:43:00',NULL);
INSERT INTO `chatmensajes` VALUES(4,2,NULL,'sistema','Canal general creado. Comparte aqu+',NULL,0,0,'2026-04-20 09:44:01',NULL);
INSERT INTO `chatmensajes` VALUES(5,2,1,'texto','Hoal a todos',NULL,0,0,'2026-04-20 09:44:01',NULL);
INSERT INTO `chatmensajes` VALUES(6,2,1,'texto','Es ahora tiempo deplnatar una tomatera ?',NULL,0,0,'2026-04-20 09:52:25',NULL);
INSERT INTO `chatmensajes` VALUES(7,4,2,'texto','Conversaci+',NULL,0,0,'2026-04-22 12:17:41',NULL);
INSERT INTO `chatmensajes` VALUES(8,5,2,'texto','Conversaci+',NULL,0,0,'2026-04-22 13:43:29',NULL);
INSERT INTO `chatmensajes` VALUES(9,5,2,'texto','Conversaci+',NULL,0,0,'2026-04-22 13:43:37',NULL);
INSERT INTO `chatmensajes` VALUES(10,5,2,'texto','Conversaci+',NULL,0,0,'2026-04-22 13:43:42',NULL);
INSERT INTO `chatmensajes` VALUES(11,1,2,'texto','Nueva consulta de soporte iniciada.',NULL,0,0,'2026-04-22 13:43:57',NULL);
INSERT INTO `chatmensajes` VALUES(12,5,2,'texto','Conversaci+',NULL,0,0,'2026-04-22 13:45:05',NULL);
INSERT INTO `chatmensajes` VALUES(13,5,2,'texto','Conversaci+',NULL,0,0,'2026-04-22 13:45:53',NULL);
INSERT INTO `chatmensajes` VALUES(14,5,2,'texto','rtyrty',NULL,0,0,'2026-04-22 13:45:57',NULL);
INSERT INTO `chatmensajes` VALUES(15,5,2,'texto','Conversaci+',NULL,0,0,'2026-04-22 13:46:34',NULL);
INSERT INTO `chatmensajes` VALUES(16,5,2,'texto','ho',NULL,0,0,'2026-04-22 13:46:39',NULL);
INSERT INTO `chatmensajes` VALUES(17,5,2,'texto','Conversaci+',NULL,0,0,'2026-04-22 13:46:58',NULL);
INSERT INTO `chatmensajes` VALUES(18,5,2,'texto','retrt',NULL,0,0,'2026-04-22 13:47:01',NULL);
INSERT INTO `chatmensajes` VALUES(19,5,2,'texto','Conversaci+',NULL,0,0,'2026-04-22 13:47:44',NULL);
INSERT INTO `chatmensajes` VALUES(20,5,2,'texto','Conversaci+',NULL,0,0,'2026-04-22 13:49:53',NULL);
INSERT INTO `chatmensajes` VALUES(21,5,2,'texto','Conversaci+',NULL,0,0,'2026-04-22 13:56:54',NULL);
INSERT INTO `chatmensajes` VALUES(22,5,2,'texto','Conversaci+',NULL,0,0,'2026-04-22 14:05:18',NULL);
INSERT INTO `chatmensajes` VALUES(23,5,2,'texto','hola',NULL,0,0,'2026-04-22 14:05:22',NULL);
INSERT INTO `chatmensajes` VALUES(24,5,2,'texto','te he denunciado porprinado',NULL,0,0,'2026-04-22 14:46:38',NULL);
INSERT INTO `chatmensajes` VALUES(25,5,1,'texto','eres un a malapersona',NULL,0,0,'2026-04-22 14:56:18',NULL);
INSERT INTO `chatmensajes` VALUES(26,6,1,'texto','Conversaci+',NULL,0,0,'2026-04-22 15:43:06',NULL);
INSERT INTO `chatmensajes` VALUES(27,7,1,'texto','Conversaci+',NULL,0,0,'2026-04-22 16:28:56',NULL);

DROP TABLE IF EXISTS `chatmensajesadjuntos`;
CREATE TABLE `chatmensajesadjuntos` (
  `idchatmensajesadjuntos` int NOT NULL AUTO_INCREMENT,
  `xchatmensajesadjuntosidchatmensajes` int NOT NULL,
  `chatmensajesadjuntosruta` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `chatmensajesadjuntosnombreoriginal` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chatmensajesadjuntostipo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chatmensajesadjuntospeso` int DEFAULT NULL,
  `chatmensajesadjuntosfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idchatmensajesadjuntos`),
  KEY `idx_chatatt_msg` (`xchatmensajesadjuntosidchatmensajes`),
  CONSTRAINT `fk_chatatt_msg` FOREIGN KEY (`xchatmensajesadjuntosidchatmensajes`) REFERENCES `chatmensajes` (`idchatmensajes`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `chatmensajeslecturas`;
CREATE TABLE `chatmensajeslecturas` (
  `idchatmensajeslecturas` int NOT NULL AUTO_INCREMENT,
  `xchatmensajeslecturasidchatmensajes` int NOT NULL,
  `xchatmensajeslecturasidusuarios` int NOT NULL,
  `chatmensajeslecturasfecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idchatmensajeslecturas`),
  UNIQUE KEY `uq_chatread_msg_user` (`xchatmensajeslecturasidchatmensajes`,`xchatmensajeslecturasidusuarios`),
  KEY `idx_chatread_user_fecha` (`xchatmensajeslecturasidusuarios`,`chatmensajeslecturasfecha`),
  CONSTRAINT `fk_chatread_msg` FOREIGN KEY (`xchatmensajeslecturasidchatmensajes`) REFERENCES `chatmensajes` (`idchatmensajes`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chatread_user` FOREIGN KEY (`xchatmensajeslecturasidusuarios`) REFERENCES `usuarios` (`idusuarios`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=331 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `chatmensajeslecturas` VALUES(1,1,1,'2026-04-20 09:40:09');
INSERT INTO `chatmensajeslecturas` VALUES(2,2,1,'2026-04-20 09:40:09');
INSERT INTO `chatmensajeslecturas` VALUES(65,4,1,'2026-04-20 09:44:01');
INSERT INTO `chatmensajeslecturas` VALUES(114,4,2,'2026-04-22 14:12:30');
INSERT INTO `chatmensajeslecturas` VALUES(115,5,2,'2026-04-22 14:12:30');
INSERT INTO `chatmensajeslecturas` VALUES(116,6,2,'2026-04-22 14:12:30');
INSERT INTO `chatmensajeslecturas` VALUES(126,3,2,'2026-04-22 14:14:26');
INSERT INTO `chatmensajeslecturas` VALUES(135,8,1,'2026-04-22 14:56:05');
INSERT INTO `chatmensajeslecturas` VALUES(136,9,1,'2026-04-22 14:56:05');
INSERT INTO `chatmensajeslecturas` VALUES(137,10,1,'2026-04-22 14:56:05');
INSERT INTO `chatmensajeslecturas` VALUES(138,12,1,'2026-04-22 14:56:05');
INSERT INTO `chatmensajeslecturas` VALUES(139,13,1,'2026-04-22 14:56:05');
INSERT INTO `chatmensajeslecturas` VALUES(140,14,1,'2026-04-22 14:56:05');
INSERT INTO `chatmensajeslecturas` VALUES(141,15,1,'2026-04-22 14:56:05');
INSERT INTO `chatmensajeslecturas` VALUES(142,16,1,'2026-04-22 14:56:05');
INSERT INTO `chatmensajeslecturas` VALUES(143,17,1,'2026-04-22 14:56:05');
INSERT INTO `chatmensajeslecturas` VALUES(144,18,1,'2026-04-22 14:56:05');
INSERT INTO `chatmensajeslecturas` VALUES(145,19,1,'2026-04-22 14:56:05');
INSERT INTO `chatmensajeslecturas` VALUES(146,20,1,'2026-04-22 14:56:05');
INSERT INTO `chatmensajeslecturas` VALUES(147,21,1,'2026-04-22 14:56:05');
INSERT INTO `chatmensajeslecturas` VALUES(148,22,1,'2026-04-22 14:56:05');
INSERT INTO `chatmensajeslecturas` VALUES(149,23,1,'2026-04-22 14:56:05');
INSERT INTO `chatmensajeslecturas` VALUES(150,24,1,'2026-04-22 14:56:05');
INSERT INTO `chatmensajeslecturas` VALUES(249,11,1,'2026-04-22 15:42:55');

DROP TABLE IF EXISTS `datosadjuntos`;
CREATE TABLE `datosadjuntos` (
  `iddatosadjuntos` int NOT NULL AUTO_INCREMENT,
  `datosadjuntostipo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `datosadjuntosmime` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `datosadjuntosnombreoriginal` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `datosadjuntostitulo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `datosadjuntosresumen` text COLLATE utf8mb4_unicode_ci,
  `datosadjuntosapuntes` text COLLATE utf8mb4_unicode_ci,
  `datosadjuntosurl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `datosadjuntosportada` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `datosadjuntosruta` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `datosadjuntospesobytes` bigint NOT NULL,
  `datosadjuntosancho` int DEFAULT NULL,
  `datosadjuntosalto` int DEFAULT NULL,
  `datosadjuntoslqip` text COLLATE utf8mb4_unicode_ci,
  `datosadjuntoscolor` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `datosadjuntosesprincipal` tinyint(1) DEFAULT '0',
  `datosadjuntosorden` int DEFAULT '0',
  `datosadjuntosdescripcion` text COLLATE utf8mb4_unicode_ci,
  `datosadjuntosactivo` tinyint(1) DEFAULT '1',
  `datosadjuntosfechacreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `datosadjuntosfechaactualizacion` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `datosadjuntosfechaeliminacion` datetime DEFAULT NULL,
  `xdatosadjuntosidusuarios` int DEFAULT NULL,
  `xdatosadjuntosidespecies` int DEFAULT NULL,
  `xdatosadjuntosidvariedades` int DEFAULT NULL,
  `xdatosadjuntosidsemillas` int DEFAULT NULL,
  `xdatosadjuntosidplantaciones` int DEFAULT NULL,
  `xdatosadjuntosidrecolecciones` int DEFAULT NULL,
  `xdatosadjuntosidlabores` int DEFAULT NULL,
  PRIMARY KEY (`iddatosadjuntos`),
  KEY `idx_tipo` (`datosadjuntostipo`),
  KEY `idx_especies` (`xdatosadjuntosidespecies`),
  KEY `idx_variedades` (`xdatosadjuntosidvariedades`)
) ENGINE=InnoDB AUTO_INCREMENT=195 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `datosadjuntos` VALUES(1,'imagen','image/jpeg','d2ddafa1-ab63-4966-b472-49e50332cebd.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/especies/especie_3_1776242200.jpg',112035,1024,559,NULL,NULL,0,0,NULL,0,'2026-04-15 10:36:40','2026-04-15 10:43:13','2026-04-15 10:43:13',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(2,'imagen','image/jpeg','d2ddafa1-ab63-4966-b472-49e50332cebd.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/especies/tomate_2.jpg',112035,1024,559,NULL,NULL,0,0,NULL,0,'2026-04-15 10:45:55','2026-04-15 10:47:04','2026-04-15 10:47:04',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(3,'imagen','image/jpeg','d2ddafa1-ab63-4966-b472-49e50332cebd.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/especies/tomate_3.jpg',112035,1024,559,NULL,NULL,0,0,NULL,0,'2026-04-15 10:47:13','2026-04-15 10:53:31','2026-04-15 10:53:31',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(4,'imagen','image/jpeg','d2ddafa1-ab63-4966-b472-49e50332cebd.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/especies/tomate_4.jpg',112035,1024,559,NULL,NULL,0,0,'Detalle de Tomate (Imagen #4)',0,'2026-04-15 10:49:13','2026-04-15 10:53:29','2026-04-15 10:53:29',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(5,'imagen','image/jpeg','d2ddafa1-ab63-4966-b472-49e50332cebd.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/especies/tomate_5.jpg',112035,1024,559,NULL,NULL,0,0,'Detalle de Tomate (Imagen #5)',0,'2026-04-15 10:53:40','2026-04-15 10:54:48','2026-04-15 10:54:48',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(6,'imagen','image/jpeg','d2ddafa1-ab63-4966-b472-49e50332cebd.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/especies/tomate_6.jpg',112035,1024,559,NULL,NULL,0,0,'Detalle de Tomate (Imagen #6)',0,'2026-04-15 10:55:03','2026-04-15 10:56:58','2026-04-15 10:56:58',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(7,'imagen','image/jpeg','d2ddafa1-ab63-4966-b472-49e50332cebd.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/especies/tomate_7.jpg',112035,1024,559,NULL,NULL,0,0,'Detalle de Tomate (Imagen #7)',0,'2026-04-15 10:57:10','2026-04-15 10:57:57','2026-04-15 10:57:57',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(8,'imagen','image/jpeg','d2ddafa1-ab63-4966-b472-49e50332cebd.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/especies/tomate_8.jpg',112035,1024,559,NULL,NULL,0,0,'Detalle de Tomate (Imagen #8)',0,'2026-04-15 10:58:09','2026-04-15 10:58:53','2026-04-15 10:58:53',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(9,'imagen','image/jpeg','d2ddafa1-ab63-4966-b472-49e50332cebd.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/especies/tomate_9.jpg',112035,1024,559,NULL,NULL,0,0,'Detalle de Tomate (Imagen #9)',0,'2026-04-15 10:58:57','2026-04-15 10:59:48','2026-04-15 10:59:48',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(10,'imagen','image/jpeg','92d981b7-ff6a-4091-bc79-b649f2ddcf2a.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/especies/tomate_10_1776243758.jpg',112035,1024,559,NULL,NULL,0,0,'Detalle de Tomate (Imagen #10)',0,'2026-04-15 11:02:38','2026-04-15 11:04:41','2026-04-15 11:04:41',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(11,'imagen','image/jpeg','92d981b7-ff6a-4091-bc79-b649f2ddcf2a.jpg','','',NULL,NULL,NULL,'uploads/especies/tomate_11.jpg',112035,1024,559,NULL,NULL,0,0,'Tomate maduro de color rojo intenso en una planta saludable.',0,'2026-04-15 11:04:48','2026-04-26 13:58:52','2026-04-26 13:22:07',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(12,'imagen','image/jpeg','4ecb4961-9941-4177-933a-3c0e1d5797c0.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/especies/tomate_12.jpg',121563,1024,559,NULL,NULL,0,0,'Tomate maduro y saludable en rodajas sobre tabla de madera.',0,'2026-04-15 11:06:03','2026-04-26 13:22:09','2026-04-26 13:22:09',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(13,'imagen','image/jpeg','a2b23884-41ce-4cc8-9773-1a5d78c6850f.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/variedad/variedad_1.jpg',172988,1024,572,NULL,NULL,0,0,'Tomates asurcados sanos en distintas etapas de maduraci+',0,'2026-04-15 17:59:10','2026-04-15 18:07:05','2026-04-15 18:07:05',NULL,NULL,12,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(14,'imagen','image/jpeg','f2abcec5-e690-48a2-a920-708a05934f4e.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/variedad/variedad_1_1776269367.jpg',79793,1024,559,NULL,NULL,0,0,'Tomate valenciano gordal maduro, de color rojo intenso y estado +',1,'2026-04-15 18:09:32','2026-04-15 18:10:06',NULL,NULL,NULL,1,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(15,'imagen','image/jpeg','6a2baa1d-f856-4aab-8590-8c5b986652f2.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/variedad/variedad_2.jpg',172988,1024,572,NULL,NULL,0,0,'Tomates saludables en distintas etapas de maduraci+',1,'2026-04-15 18:09:37','2026-04-15 18:10:12',NULL,NULL,NULL,1,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(16,'imagen','image/jpeg','f2abcec5-e690-48a2-a920-708a05934f4e.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/variedad/variedad_2_1776269489.jpg',79793,1024,559,NULL,NULL,0,0,'Tomate costillado maduro, rojo vibrante, piel sana y estado +',0,'2026-04-15 18:11:35','2026-04-15 18:11:55','2026-04-15 18:11:55',NULL,NULL,12,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(17,'imagen','image/jpeg','f2abcec5-e690-48a2-a920-708a05934f4e.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/variedad/tomate_variedad_valenciano_gordal_plus_3.jpg',79793,1024,559,NULL,NULL,0,0,'Tomate maduro, gran calibre, costillas marcadas, sano y color intenso.',0,'2026-04-15 18:14:16','2026-04-15 18:15:20','2026-04-15 18:15:20',NULL,NULL,12,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(18,'imagen','image/jpeg','f2abcec5-e690-48a2-a920-708a05934f4e.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/variedad/tomate_variedad_valenciano_gordal_plus_4.jpg',79793,1024,559,NULL,NULL,0,0,'Tomate - Variedad Valenciano Gordal Plus: Tomate maduro, globoso y acostillado en excelente estado de salud.',0,'2026-04-15 18:15:47','2026-04-15 18:17:53','2026-04-15 18:17:53',NULL,NULL,12,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(19,'imagen','image/jpeg','6a2baa1d-f856-4aab-8590-8c5b986652f2.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/variedad/tomate_variedad_valenciano_gordal_plus_5.jpg',172988,1024,572,NULL,NULL,0,0,'Tomate - Variedad Valenciano Gordal Plus: Planta saludable con frutos carnosos en distintos puntos de madurez.',0,'2026-04-15 18:16:03','2026-04-15 18:17:55','2026-04-15 18:17:55',NULL,NULL,12,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(20,'imagen','image/jpeg','f2abcec5-e690-48a2-a920-708a05934f4e.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/variedad/tomate-variedad-valenciano-gordal-plus_6.jpg',79793,1024,559,NULL,NULL,0,0,'Tomate - Variedad Valenciano Gordal Plus: Tomate acostillado, rojo intenso, sano y en madurez comercial +',0,'2026-04-15 18:18:03','2026-04-15 18:20:28','2026-04-15 18:20:28',NULL,NULL,12,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(21,'imagen','image/jpeg','6a2baa1d-f856-4aab-8590-8c5b986652f2.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/variedad/tomate-variedad-valenciano-gordal-plus_7.jpg',172988,1024,572,NULL,NULL,0,0,'Tomate - Variedad Valenciano Gordal Plus: Grandes tomates sanos madurando progresivamente sobre una planta vigorosa.',0,'2026-04-15 18:18:09','2026-04-15 18:20:30','2026-04-15 18:20:30',NULL,NULL,12,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(22,'imagen','image/jpeg','f2abcec5-e690-48a2-a920-708a05934f4e.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/variedad/tomate-variedad-valenciano-gordal-plus_8.jpg',79793,1024,559,NULL,NULL,0,0,'Tomate - Variedad Valenciano Gordal Plus: Tomate maduro, gran calibre, costillado y en +',0,'2026-04-15 18:26:21','2026-04-15 18:28:37','2026-04-15 18:28:37',NULL,NULL,12,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(23,'imagen','image/jpeg','f2abcec5-e690-48a2-a920-708a05934f4e.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/variedad/tomate-variedad-valenciano-gordal-plus_9.jpg',79793,1024,559,NULL,NULL,0,0,'Tomate - Variedad Valenciano Gordal Plus: Tomate Valenciano maduro, sano, firme y de forma marcadamente acostillada.',0,'2026-04-15 18:51:18','2026-04-15 18:53:48','2026-04-15 18:53:48',NULL,NULL,12,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(24,'imagen','image/jpeg','f2abcec5-e690-48a2-a920-708a05934f4e.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/variedad/tomate-variedad-valenciano-gordal-plus_10.jpg',79793,1024,559,NULL,NULL,0,0,'Tomate - Variedad Valenciano Gordal Plus: Fruto acostillado de gran calibre, madurez +',1,'2026-04-15 18:55:50',NULL,NULL,NULL,NULL,12,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(25,'imagen','image/jpeg','6a2baa1d-f856-4aab-8590-8c5b986652f2.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/variedad/tomate-variedad-valenciano-gordal-plus_11.jpg',172988,1024,572,NULL,NULL,0,0,'Tomate - Variedad Valenciano Gordal Plus: Tomates grandes acostillados, planta saludable en diversos estados de maduraci+',1,'2026-04-15 18:56:04',NULL,NULL,NULL,NULL,12,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(26,'imagen','image/jpeg','69244b7f-9790-41aa-81c2-d5780de9f536.jpg',NULL,NULL,NULL,NULL,NULL,'uploads/variedad/tomate-variedad-valenciano-gordal-plus_12.jpg',123055,1024,559,NULL,NULL,0,0,'Tomate - Variedad Valenciano Gordal Plus: Tomates maduros, carnosos y sanos de gran calibre y calidad.',1,'2026-04-15 18:56:09',NULL,NULL,NULL,NULL,12,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(27,'documento','application/pdf','hd_1985_05.pdf',NULL,NULL,NULL,NULL,NULL,'uploads/especies/tomate_13.pdf',1044893,0,0,NULL,NULL,0,0,'Detalle de Tomate (Imagen #13)',0,'2026-04-18 12:13:36','2026-04-18 12:21:47','2026-04-18 12:21:47',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(28,'documento','application/pdf','hd_1985_05 (1).pdf','hd_1985_05 (1).pdf',NULL,NULL,NULL,NULL,'uploads/especies/tomate_14.pdf',1044893,0,0,NULL,NULL,0,0,'Detalle de Tomate (Imagen #14)',0,'2026-04-18 12:21:56','2026-04-18 12:37:52','2026-04-18 12:37:52',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(29,'documento','application/pdf','hd_1985_05 (1).pdf','Medios de protecci+','Gu+',NULL,NULL,NULL,'uploads/especies/tomate_15.pdf',1044893,0,0,NULL,NULL,0,0,'Detalle de Tomate (Imagen #15)',0,'2026-04-18 12:38:13','2026-04-18 12:38:48','2026-04-18 12:38:48',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(30,'documento','application/pdf','2005,-El-cultivo-de-la-zanahoria,-F.pdf','Gu+','Gu+',NULL,NULL,NULL,'uploads/especies/zanahoria_1.pdf',533838,0,0,NULL,NULL,0,0,'Vista general de Zanahoria',1,'2026-04-18 12:56:08','2026-04-18 12:56:17',NULL,NULL,9,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(31,'documento','text/html','Manual_Zanahoria_Cundinamarca.pdf','Manual_Zanahoria_Cundinamarca.pdf',NULL,NULL,NULL,NULL,'uploads/especies/zanahoria_2.pdf',434204,0,0,NULL,NULL,0,0,'Detalle de Zanahoria (Imagen #2)',1,'2026-04-18 12:57:14',NULL,NULL,NULL,9,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(32,'documento','application/pdf','hd_1985_05 (1).pdf','Medios de protecci+','Manual t+',NULL,NULL,NULL,'uploads/especies/tomate_16.pdf',1044893,0,0,NULL,NULL,0,0,'Detalle de Tomate (Imagen #16)',0,'2026-04-18 13:02:20','2026-04-18 13:03:23','2026-04-18 13:03:23',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(33,'documento','application/pdf','i3359s.pdf','El cultivo de tomate con Buenas Pr+','Manual t+',NULL,'https://www.fao.org/3/i3359s/i3359s.pdf',NULL,'uploads/especies/tomate_17.pdf',8396817,0,0,NULL,NULL,0,0,'Detalle de Tomate (Imagen #17)',0,'2026-04-18 13:04:37','2026-04-18 13:09:47','2026-04-18 13:09:47',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(34,'documento','application/pdf','as415s.pdf','Estado del Arte y Novedades de la Bioenerg+','Informe de la FAO que analiza el desarrollo de la bioenerg+',NULL,'https://www.fao.org/3/as415s/as415s.pdf','uploads/especies/portadas/tomate_18.pdf_cover.jpg','uploads/especies/tomate_18.pdf',413587,0,0,NULL,NULL,0,0,'Detalle de Tomate (Imagen #18)',0,'2026-04-18 13:13:25','2026-04-26 16:44:55','2026-04-26 16:44:55',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(35,'imagen','image/png','ChatGPT Image 9 mar 2026, 12_25_06.png','ChatGPT Image 9 mar 2026, 12_25_06.png',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_1.png',852773,1536,1024,NULL,NULL,0,0,'Variedad de frutas y hortalizas frescas en +',0,'2026-04-18 18:11:22','2026-04-18 18:20:55','2026-04-18 18:20:55',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(36,'imagen','image/png','ChatGPT Image 9 mar 2026, 12_39_23.png','','',NULL,NULL,NULL,'uploads/usuario/usuario_2.png',1482028,1536,1024,NULL,NULL,0,0,'Muestra variada de frutos y hortalizas frescas en madurez +',0,'2026-04-18 18:12:29','2026-04-18 18:45:21','2026-04-18 18:45:21',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(37,'imagen','image/png','ChatGPT Image 9 mar 2026, 12_39_23.png','','',NULL,NULL,NULL,'uploads/usuario/usuario_3.png',1482028,1536,1024,NULL,NULL,0,0,'Frutos y hortalizas variados en estado +',0,'2026-04-18 18:14:20','2026-04-18 18:41:45','2026-04-18 18:41:45',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(38,'imagen','image/png','ChatGPT Image 9 mar 2026, 12_39_23.png','ChatGPT Image 9 mar 2026, 12_39_23.png',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_4.png',1482028,1536,1024,NULL,NULL,0,0,'Diversos frutos y hortalizas frescas en perfecto estado de madurez.',0,'2026-04-18 18:16:34','2026-04-18 18:37:21','2026-04-18 18:37:21',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(39,'imagen','image/jpeg','images.jpeg','images.jpeg',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_5.jpeg',3194,275,183,NULL,NULL,0,0,'No es vegetal; son paneles solares fotovoltaicos en perfecto estado.',0,'2026-04-18 18:16:57','2026-04-18 18:23:42','2026-04-18 18:23:42',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(40,'imagen','image/jpeg','2020-01-17. FOTO. Juan Cano Aviles.jpg','','',NULL,NULL,NULL,'uploads/usuario/usuario_6.jpg',47946,236,295,NULL,NULL,0,0,'Ejemplar humano maduro, saludable, con anteojos y vestimenta oscura.',0,'2026-04-18 18:25:11','2026-04-18 19:17:12','2026-04-18 18:49:29',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(41,'imagen','image/png','ChatGPT Image 9 mar 2026, 12_32_15.png','ChatGPT Image 9 mar 2026, 12_32_15.png',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_7.png',1440678,1024,1024,NULL,NULL,0,0,'Ilustraci+',0,'2026-04-18 18:45:47','2026-04-18 18:49:31','2026-04-18 18:49:31',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(42,'imagen','image/png','ChatGPT Image 9 mar 2026, 12_12_18.png','ChatGPT Image 9 mar 2026, 12_12_18.png',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_8.png',257506,1024,1024,NULL,NULL,0,0,'Fruto b+',0,'2026-04-18 18:45:55','2026-04-18 18:49:35','2026-04-18 18:49:35',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(43,'imagen','image/png','ChatGPT Image 9 mar 2026, 12_32_15.png','ChatGPT Image 9 mar 2026, 12_32_15.png',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_9.png',1440678,1024,1024,NULL,NULL,0,0,'Ilustraci+',0,'2026-04-18 18:46:01','2026-04-18 18:49:39','2026-04-18 18:49:39',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(44,'imagen','image/png','ChatGPT Image 9 mar 2026, 12_25_06.png','ChatGPT Image 9 mar 2026, 12_25_06.png',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_10.png',852773,1536,1024,NULL,NULL,0,0,'Muestrario de productos vegetales frescos con madurez y sanidad +',0,'2026-04-18 18:46:14','2026-04-18 18:49:41','2026-04-18 18:49:41',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(45,'imagen','image/jpeg','WIN_20251202_09_22_44_Pro.jpg','WIN_20251202_09_22_44_Pro.jpg',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_11.jpg',157674,1920,1080,NULL,NULL,0,0,'',0,'2026-04-18 18:50:26','2026-04-18 18:52:20','2026-04-18 18:52:20',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(46,'imagen','image/jpeg','WIN_20250930_16_01_36_Pro.jpg','WIN_20250930_16_01_36_Pro.jpg',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_12.jpg',169058,1920,1080,NULL,NULL,0,0,'',0,'2026-04-18 18:52:45','2026-04-18 18:53:08','2026-04-18 18:53:08',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(47,'imagen','image/jpeg','WIN_20251202_09_22_44_Pro.jpg','WIN_20251202_09_22_44_Pro.jpg',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_13.jpg',157674,1920,1080,NULL,NULL,0,0,'',0,'2026-04-18 18:53:45','2026-04-18 18:53:53','2026-04-18 18:53:53',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(48,'imagen','image/jpeg','WIN_20251202_09_22_44_Pro.jpg','WIN_20251202_09_22_44_Pro.jpg',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_14.jpg',157674,1920,1080,NULL,NULL,0,0,'',0,'2026-04-18 18:53:58','2026-04-18 18:54:41','2026-04-18 18:54:41',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(49,'imagen','image/jpeg','WIN_20251202_09_22_44_Pro.jpg','WIN_20251202_09_22_44_Pro.jpg',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_15.jpg',157674,1920,1080,NULL,NULL,0,0,'',0,'2026-04-18 18:54:45','2026-04-18 18:54:55','2026-04-18 18:54:55',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(50,'imagen','image/jpeg','1 .jpg','1 .jpg',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_16.jpg',142126,1920,1080,NULL,NULL,0,0,'',0,'2026-04-18 18:55:01','2026-04-18 18:55:49','2026-04-18 18:55:49',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(51,'imagen','image/jpeg','1 .jpg','1 .jpg',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_17.jpg',142126,1920,1080,NULL,NULL,0,0,'',0,'2026-04-18 18:56:00','2026-04-18 18:56:04','2026-04-18 18:56:04',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(52,'imagen','image/jpeg','1 (12).jpg','1 (12).jpg',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_18.jpg',39088,263,350,NULL,NULL,0,0,'',0,'2026-04-18 18:56:10','2026-04-18 18:57:13','2026-04-18 18:57:13',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(53,'imagen','image/jpeg','WIN_20251202_09_22_44_Pro.jpg','WIN_20251202_09_22_44_Pro.jpg',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_19.jpg',157674,1920,1080,NULL,NULL,0,0,'',0,'2026-04-18 18:56:18','2026-04-18 18:56:22','2026-04-18 18:56:22',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(54,'imagen','image/jpeg','1 .jpg','','',NULL,NULL,NULL,'uploads/usuario/usuario_20.jpg',142126,1920,1080,NULL,NULL,0,0,'',0,'2026-04-18 18:57:46','2026-04-18 19:00:43','2026-04-18 19:00:43',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(55,'imagen','image/jpeg','2012-12-04 16.23.42.jpg','2012-12-04 16.23.42.jpg',NULL,NULL,NULL,NULL,'uploads/usuario/usuario_21.jpg',60111,320,240,NULL,NULL,0,0,'',0,'2026-04-18 18:57:58','2026-04-18 18:58:05','2026-04-18 18:58:05',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(56,'imagen','image/jpeg','1 (13).jpg','','{"profile_object_x":54,"profile_object_y":65}',NULL,NULL,NULL,'uploads/usuario/usuario_22.jpg',67043,281,374,NULL,NULL,0,0,'',0,'2026-04-18 19:03:14','2026-04-18 19:05:53','2026-04-18 19:05:53',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(57,'imagen','image/jpeg','WIN_20251120_17_59_34_Pro.jpg','','{"profile_object_x":50,"profile_object_y":38,"profile_style":""}',NULL,NULL,NULL,'uploads/usuario/usuario_23.jpg',172902,1920,1080,NULL,NULL,0,0,'',0,'2026-04-18 19:06:04','2026-04-22 18:09:16','2026-04-18 19:29:47',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(58,'imagen','image/jpeg','1 .jpg','','{"profile_object_x":50,"profile_object_y":38,"profile_style":""}',NULL,NULL,NULL,'uploads/usuario/usuario_24.jpg',142126,1920,1080,NULL,NULL,0,0,'',0,'2026-04-18 19:30:19','2026-04-18 19:37:23','2026-04-18 19:37:23',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(59,'imagen','image/jpeg','1 .jpg','','{"profile_object_x":48,"profile_object_y":37,"profile_style":""}',NULL,NULL,NULL,'uploads/usuario/usuario_25.jpg',142126,1920,1080,NULL,NULL,0,0,'',0,'2026-04-18 19:37:27','2026-04-22 18:12:20','2026-04-22 18:09:19',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(60,'imagen','image/jpeg','1 (14).jpg','1 (14).jpg',NULL,NULL,NULL,NULL,'uploads/especies/tomate_19.jpg',46534,275,367,NULL,NULL,0,0,'No se visualiza un tomate, sino el retrato de un hombre.',0,'2026-04-19 18:30:56','2026-04-19 18:31:11','2026-04-19 18:31:11',1,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(61,'imagen','image/jpeg','8948c996-5e64-430d-8840-1666c59d46bd.jpg','8948c996-5e64-430d-8840-1666c59d46bd.jpg',NULL,NULL,NULL,NULL,'uploads/especies/tomate_20.jpg',150157,1024,559,NULL,NULL,0,0,'Tomate maduro en planta saludable con follaje vigoroso y flores.',0,'2026-04-20 09:08:38','2026-04-20 09:08:59','2026-04-20 09:08:59',1,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(62,'imagen','image/jpeg','8948c996-5e64-430d-8840-1666c59d46bd.jpg','8948c996-5e64-430d-8840-1666c59d46bd.jpg',NULL,NULL,NULL,NULL,'uploads/especies/tomate_21.jpg',150157,1024,559,NULL,NULL,0,0,'Tomate maduro y saludable rodeado de frutos verdes en crecimiento.',0,'2026-04-20 09:08:42','2026-04-20 09:08:53','2026-04-20 09:08:53',1,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(63,'imagen','image/jpeg','8948c996-5e64-430d-8840-1666c59d46bd.jpg','8948c996-5e64-430d-8840-1666c59d46bd.jpg',NULL,NULL,NULL,NULL,'uploads/especies/tomate_22.jpg',150157,1024,559,NULL,NULL,0,0,'Tomate maduro y saludable en planta con excelente vigor vegetativo.',0,'2026-04-20 09:09:20','2026-04-20 09:11:34','2026-04-20 09:11:34',1,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(64,'imagen','image/jpeg','8948c996-5e64-430d-8840-1666c59d46bd.jpg','8948c996-5e64-430d-8840-1666c59d46bd.jpg',NULL,NULL,NULL,NULL,'uploads/especies/tomate_23.jpg',150157,1024,559,NULL,NULL,0,0,'Tomate rojo maduro y saludable en planta con frutos verdes.',0,'2026-04-20 09:09:23','2026-04-20 09:11:37','2026-04-20 09:11:37',1,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(65,'imagen','image/jpeg','8948c996-5e64-430d-8840-1666c59d46bd.jpg','8948c996-5e64-430d-8840-1666c59d46bd.jpg',NULL,NULL,NULL,NULL,'uploads/especies/tomate_24.jpg',150157,1024,559,NULL,NULL,0,0,'Tomate rojo maduro y saludable en planta con follaje verde.',0,'2026-04-20 09:11:48','2026-04-20 09:12:01','2026-04-20 09:12:01',1,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(66,'imagen','image/jpeg','8948c996-5e64-430d-8840-1666c59d46bd.jpg','','',NULL,NULL,NULL,'uploads/especies/tomate_25.jpg',150157,1024,559,NULL,NULL,0,0,'Tomate rojo maduro y saludable en planta con frutos verdes.',0,'2026-04-20 09:12:20','2026-04-20 10:09:07','2026-04-20 10:02:12',1,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(67,'imagen','image/jpeg','8948c996-5e64-430d-8840-1666c59d46bd.jpg','8948c996-5e64-430d-8840-1666c59d46bd.jpg',NULL,NULL,NULL,NULL,'uploads/especies/tomate_26.jpg',150157,1024,559,NULL,NULL,0,0,'Tomate maduro y sano en planta con +',0,'2026-04-20 10:03:02','2026-04-20 10:05:58','2026-04-20 10:05:58',1,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(68,'imagen','image/jpeg','8948c996-5e64-430d-8840-1666c59d46bd.jpg','','',NULL,NULL,NULL,'uploads/especies/tomate_27.jpg',150157,1024,559,NULL,NULL,0,0,'Tomate rojo maduro en planta sana con follaje verde vigoroso.',0,'2026-04-20 10:06:18','2026-04-22 18:12:17','2026-04-22 18:12:17',1,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(69,'documento','application/pdf','RENF01CH517t.pdf','Manual de cultivo de tomate (Nicaragua)','Manual t+',NULL,'','uploads/especies/portadas/tomate_28.pdf_cover.jpg','uploads/especies/tomate_28.pdf',499275,0,0,NULL,NULL,0,0,'Detalle de Tomate (Imagen #28)',0,'2026-04-20 10:12:09','2026-04-26 15:51:15','2026-04-26 15:51:15',1,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(75,'imagen','image/jpeg','09c55399-1d41-46cd-84b1-b860fcc61281.jpg','','',NULL,NULL,NULL,'uploads/variedad/calabac-n-variedad-verde_1.jpg',164760,1024,559,NULL,NULL,1,0,'Calabac+',1,'2026-04-20 15:19:34','2026-04-20 15:19:40',NULL,NULL,NULL,34,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(95,'imagen','image/jpeg','1 (13).jpg','','{"profile_object_x":49,"profile_object_y":25,"profile_object_zoom":100,"profile_style":""}',NULL,NULL,NULL,'uploads/usuario/usuario_36.jpg',67043,281,374,NULL,NULL,0,0,'',0,'2026-04-22 18:11:58','2026-04-23 19:48:57','2026-04-23 19:42:05',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(96,'imagen','image/jpeg','usuario_36.jpg',NULL,'{"profile_object_x":49,"profile_object_y":25,"profile_object_zoom":100,"profile_brightness":100,"profile_contrast":100,"profile_style":"comic"}',NULL,NULL,NULL,'uploads/usuario/usuario_1_1776972805914.jpg',67043,NULL,NULL,NULL,NULL,0,2,NULL,0,'2026-04-23 19:33:26','2026-05-02 12:58:04','2026-05-02 12:58:04',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(97,'imagen','image/jpeg','WIN_20251030_18_10_16_Pro.jpg',NULL,'{"profile_object_x":48,"profile_object_y":22,"profile_object_zoom":190,"profile_style":""}',NULL,NULL,NULL,'uploads/usuario/usuario_1_1776973359871.jpg',85795,NULL,NULL,NULL,NULL,0,2,NULL,0,'2026-04-23 19:42:40','2026-04-23 20:30:00','2026-04-23 19:54:19',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(98,'imagen','image/jpeg','20221030_131338.jpg',NULL,'{"profile_object_x":59.641022035759924,"profile_object_y":15.340579710144926,"profile_object_zoom":230,"profile_style":""}',NULL,NULL,NULL,'uploads/usuario/usuario_1_1776974113151.jpg',1899717,NULL,NULL,NULL,NULL,0,2,NULL,0,'2026-04-23 19:55:13','2026-05-02 12:58:02','2026-05-02 12:58:02',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(99,'imagen','image/jpeg','1 (16).jpg',NULL,'{"profile_object_x":54,"profile_object_y":36,"profile_object_zoom":100,"profile_style":""}',NULL,NULL,NULL,'uploads/usuario/usuario_1_1776974156034.jpg',22183,NULL,NULL,NULL,NULL,0,3,NULL,0,'2026-04-23 19:55:56','2026-04-23 19:56:51','2026-04-23 19:56:51',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(100,'imagen','image/jpeg','20210529_115259.jpg',NULL,'{"profile_object_x":54.42496661751952,"profile_object_y":15.625923099508553,"profile_object_zoom":117,"profile_brightness":100,"profile_contrast":100,"profile_style":""}',NULL,NULL,NULL,'uploads/usuario/usuario_1_1776974200725.jpg',1221061,NULL,NULL,NULL,NULL,0,4,NULL,0,'2026-04-23 19:56:41','2026-05-02 12:58:06','2026-05-02 12:58:06',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(101,'imagen','image/jpeg','20221001_211125.jpg',NULL,'{"profile_object_x":47,"profile_object_y":37,"profile_object_zoom":100,"profile_brightness":90,"profile_contrast":149,"profile_style":""}',NULL,NULL,NULL,'uploads/usuario/usuario_1_1776974258619.jpg',489143,NULL,NULL,NULL,NULL,0,4,NULL,0,'2026-04-23 19:57:39','2026-05-02 12:58:08','2026-05-02 12:58:08',1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(102,'imagen','image/jpeg','1000063946.jpg',NULL,'{"profile_object_x":14.747754630214445,"profile_object_y":63.5766747754491,"profile_object_zoom":265,"profile_brightness":62,"profile_contrast":100,"profile_style":""}',NULL,NULL,NULL,'uploads/usuario/usuario_20_1777055888195.jpg',166525,NULL,NULL,NULL,NULL,1,1,NULL,1,'2026-04-24 18:38:08','2026-04-24 18:38:46',NULL,20,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(103,'imagen','image/png','Gemini_Generated_Image_yivbjnyivbjnyivb.png',NULL,NULL,NULL,NULL,NULL,'uploads/especies/especie_3_1777210029363.png',2458950,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-26 13:27:07','2026-04-26 13:58:52','2026-04-26 13:41:43',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(104,'imagen','image/png','Gemini_Generated_Image_yivbjnyivbjnyivb.png',NULL,'{"profile_object_x":50,"profile_object_y":38,"profile_object_zoom":100,"profile_style":"","seo_alt":"Tomate rojo maduro en la planta con hojas verdes y gotas de agua."}',NULL,NULL,NULL,'uploads/especies/especie_3_1777210912258.png',2458950,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-26 13:41:55','2026-04-26 13:58:52','2026-04-26 13:44:17',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(105,'imagen','image/png','Gemini_Generated_Image_yivbjnyivbjnyivb.png',NULL,'{"profile_object_x":50,"profile_object_y":38,"profile_object_zoom":100,"profile_style":"","seo_alt":"Tomate rojo maduro en la planta con hojas verdes y gotas de agua."}',NULL,NULL,NULL,'uploads/especies/tomate-rojo-maduro-en-la-planta-con-hojas-verdes-y-gotas-de-agua-1777211105513.png',2458950,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-26 13:45:04','2026-04-26 13:58:52','2026-04-26 13:47:10',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(106,'imagen','image/png','Gemini_Generated_Image_yivbjnyivbjnyivb.png',NULL,'{"profile_object_x":48.020833333333336,"profile_object_y":37.6875,"profile_object_zoom":144,"profile_brightness":100,"profile_contrast":100,"profile_style":"","seo_alt":"Tomate rojo maduro con gotas de agua en la planta, rodeado de hojas verdes."}',NULL,NULL,NULL,'uploads/especies/tomate-rojo-maduro-con-gotas-de-agua-en-la-planta-rodeado-de-hojas-verdes-1777211239759.png',2458950,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-26 13:47:18','2026-04-26 14:04:23','2026-04-26 14:03:31',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(107,'imagen','image/jpeg','19845da7-ca5a-41d8-ba1a-603b327fce11.jpg',NULL,'{"profile_object_x":50,"profile_object_y":38,"profile_object_zoom":100,"profile_style":"","seo_alt":"Tomate rojo maduro con gotas de agua en la planta, en un huerto soleado."}',NULL,NULL,NULL,'uploads/especies/tomate-rojo-maduro-con-gotas-de-agua-en-la-planta-en-un-huerto-soleado-1777211815968.jpg',151543,NULL,NULL,NULL,NULL,0,2,NULL,0,'2026-04-26 13:56:54','2026-04-26 14:03:33','2026-04-26 14:03:33',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(108,'imagen','image/jpeg','8b940444-711f-45d2-a95e-4661ed6e8fe4.jpg',NULL,'{"profile_object_x":50,"profile_object_y":38,"profile_object_zoom":100,"profile_style":"","seo_alt":"Tomates rojos maduros con gotas de agua en una planta en el jardín."}',NULL,NULL,NULL,'uploads/especies/tomates-rojos-maduros-con-gotas-de-agua-en-una-planta-en-el-jardin-1777211984964.jpg',140829,NULL,NULL,NULL,NULL,0,3,NULL,0,'2026-04-26 13:59:43','2026-04-26 14:03:36','2026-04-26 14:03:36',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(109,'imagen','image/jpeg','8b940444-711f-45d2-a95e-4661ed6e8fe4.jpg',NULL,'{"profile_object_x":50,"profile_object_y":38,"profile_object_zoom":100,"profile_style":"","seo_alt":"Tomates rojos maduros con gotas de agua en una planta en un huerto soleado."}',NULL,NULL,NULL,'uploads/especies/tomates-rojos-maduros-con-gotas-de-agua-en-una-planta-en-un-huerto-soleado-1777212226342.webp',140829,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-26 14:03:45','2026-04-26 14:34:37','2026-04-26 14:34:37',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(110,'imagen','image/jpeg','552718e0-a8f3-4dfd-9c94-e4249cdc16cd.jpg',NULL,'{"profile_object_x":50,"profile_object_y":38,"profile_object_zoom":138,"profile_brightness":100,"profile_contrast":100,"profile_style":"","seo_alt":"Tomate rojo maduro con gotas de agua en una planta de huerto."}',NULL,NULL,NULL,'uploads/especies/tomate-rojo-maduro-con-gotas-de-agua-en-una-planta-de-huerto-1777212233024.webp',151543,NULL,NULL,NULL,NULL,0,2,NULL,0,'2026-04-26 14:03:51','2026-04-26 14:34:35','2026-04-26 14:34:35',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(111,'imagen','image/jpeg','c5ba5775-648e-4729-aa66-10f43fb6ce75.jpg',NULL,'{"profile_object_x":50,"profile_object_y":38,"profile_object_zoom":151,"profile_brightness":100,"profile_contrast":100,"profile_style":"","seo_alt":"Tomate rojo maduro en planta con hojas verdes y tomates verdes."}',NULL,NULL,NULL,'uploads/especies/tomate-rojo-maduro-en-planta-con-hojas-verdes-y-tomates-verdes-1777212246151.webp',150157,NULL,NULL,NULL,NULL,0,3,NULL,0,'2026-04-26 14:04:04','2026-04-26 15:15:32','2026-04-26 14:34:40',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(112,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":38,"profile_object_zoom":100,"profile_style":"","seo_alt":"Tomate rojo maduro en planta con hojas verdes y tomates verdes.","dominant_color":"rgb(24, 56, 8)","vibrant_color":"#d02b0c","blurhash":"LGD,6+0gpGpC~mNGjcV[O?M|$7Vu","exif_data":null}',NULL,NULL,NULL,'uploads/especies/tomate-rojo-maduro-en-planta-con-hojas-verdes-y-tomates-verdes-1777214090621.webp',130863,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-26 14:34:52','2026-04-26 15:15:32','2026-04-26 14:37:34',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(113,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"Tomate rojo maduro en planta con hojas verdes y tomates verdes.","dominant_color":"rgb(24, 56, 8)","vibrant_color":"#d02b0c","blurhash":"LGD,6+0gpGpC~mNGjcV[O?M|$7Vu","exif_data":null}',NULL,NULL,NULL,'uploads/especies/tomate-rojo-maduro-en-planta-con-hojas-verdes-y-tomates-verdes-1777214280437.webp',130863,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-26 14:37:59','2026-04-26 15:15:32','2026-04-26 14:38:17',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(114,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"Tomate rojo maduro en planta con hojas verdes y tomates inmaduros.","dominant_color":"rgb(24, 56, 8)","vibrant_color":"#d02b0c","blurhash":"LGD,6+0gpGpC~mNGjcV[O?M|$7Vu","exif_data":null}',NULL,NULL,NULL,'uploads/especies/tomate-rojo-maduro-en-planta-con-hojas-verdes-y-tomates-inmaduros-1777214351735.webp',130863,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-26 14:39:11','2026-04-26 15:15:32','2026-04-26 14:40:42',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(115,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"Tomate rojo maduro con gotas de agua en planta verde de huerto.","dominant_color":"rgb(24, 56, 8)","vibrant_color":"#d02b0c","blurhash":"LGD,6+0gpGpC~mNGjcV[O?M|$7Vu","exif_data":null}',NULL,NULL,NULL,'uploads/especies/tomate-rojo-maduro-con-gotas-de-agua-en-planta-verde-de-huerto-1777214451174.webp',130863,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-26 14:40:50','2026-04-26 15:15:32','2026-04-26 14:43:04',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(116,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":144,"profile_brightness":100,"profile_contrast":100,"profile_style":"","seo_alt":"Tomate rojo maduro en planta con hojas verdes y tomates verdes en huerto."}',NULL,NULL,NULL,'uploads/especies/tomate-rojo-maduro-en-planta-con-hojas-verdes-y-tomates-verdes-en-huerto-1777214593185.webp',130863,NULL,NULL,NULL,NULL,1,1,NULL,1,'2026-04-26 14:43:12','2026-04-26 15:15:57',NULL,NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(117,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":140,"profile_brightness":100,"profile_contrast":100,"profile_style":"","seo_alt":""}',NULL,NULL,NULL,'uploads/especies/tomate-1777214610450.webp',150004,NULL,NULL,NULL,NULL,0,2,NULL,0,'2026-04-26 14:43:29','2026-04-26 14:44:18','2026-04-26 14:44:18',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(118,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"","dominant_color":"rgb(8, 40, 8)","vibrant_color":"#d9742b","blurhash":"LKE{E#0MK$%G~nEKkDoITvRQ,Haf","exif_data":null}',NULL,NULL,NULL,'uploads/especies/tomate-1777214625442.webp',140803,NULL,NULL,NULL,NULL,0,3,NULL,0,'2026-04-26 14:43:44','2026-04-26 14:44:21','2026-04-26 14:44:21',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(119,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"","dominant_color":"rgb(8, 40, 8)","vibrant_color":"#d88429","blurhash":"LLDmA^0LcEtK~nE1s=V@TJM{$kVu","exif_data":null}',NULL,NULL,NULL,'uploads/especies/tomate-1777214669675.webp',150004,NULL,NULL,NULL,NULL,0,2,NULL,0,'2026-04-26 14:44:28','2026-04-26 14:45:06','2026-04-26 14:45:06',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(120,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"","dominant_color":"rgb(8, 40, 8)","vibrant_color":"#d88429","blurhash":"LLDmA^0LcEtK~nE1s=V@TJM{$kVu","exif_data":null}',NULL,NULL,NULL,'uploads/especies/tomate-1777214743053.webp',150004,NULL,NULL,NULL,NULL,0,2,NULL,0,'2026-04-26 14:45:42','2026-04-26 14:45:57','2026-04-26 14:45:57',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(121,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":132,"profile_brightness":100,"profile_contrast":100,"profile_style":"","seo_alt":"Tomate rojo maduro con gotas de agua en la planta, con hojas verdes y tutores."}',NULL,NULL,NULL,'uploads/especies/tomate-rojo-maduro-con-gotas-de-agua-en-la-planta-con-hojas-verdes-y-tutores-1777214766014.webp',150004,NULL,NULL,NULL,NULL,0,2,NULL,1,'2026-04-26 14:46:05','2026-04-26 14:49:29',NULL,NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(122,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":38,"profile_object_zoom":100,"profile_brightness":100,"profile_contrast":100,"profile_style":"","seo_alt":""}',NULL,NULL,NULL,'uploads/especies/tomate-1777214777799.webp',140803,NULL,NULL,NULL,NULL,0,3,NULL,0,'2026-04-26 14:46:16','2026-04-26 14:54:59','2026-04-26 14:54:59',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(123,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"","dominant_color":"rgb(8, 40, 8)","vibrant_color":"#c24a18","blurhash":"LJDvc40Mtk%G~nEKf,j=yBRQwzaf","exif_data":null}',NULL,NULL,NULL,'uploads/especies/tomate-1777215232323.webp',140571,NULL,NULL,NULL,NULL,0,4,NULL,0,'2026-04-26 14:53:52','2026-04-26 14:54:37','2026-04-26 14:54:37',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(124,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"","dominant_color":"rgb(8, 40, 8)","vibrant_color":"#d9742b","blurhash":"LKE{E#0MK$%G~nEKkDoITvRQ,Haf","exif_data":null}',NULL,NULL,NULL,'uploads/especies/tomate-1777215342198.webp',140803,NULL,NULL,NULL,NULL,0,3,NULL,0,'2026-04-26 14:55:41','2026-04-26 14:55:57','2026-04-26 14:55:57',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(125,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"","dominant_color":"rgb(8, 40, 8)","vibrant_color":"#d9742b","blurhash":"LKE{E#0MK$%G~nEKkDoITvRQ,Haf","exif_data":null}',NULL,NULL,NULL,'uploads/especies/tomate-1777215361860.webp',140803,NULL,NULL,NULL,NULL,0,3,NULL,0,'2026-04-26 14:56:01','2026-04-26 14:57:05','2026-04-26 14:57:05',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(126,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"","dominant_color":"rgb(8, 40, 8)","vibrant_color":"#d9742b","blurhash":"LKE{E#0MK$%G~nEKkDoITvRQ,Haf","exif_data":null}',NULL,NULL,NULL,'uploads/especies/tomate-1777215464700.webp',140803,NULL,NULL,NULL,NULL,0,3,NULL,0,'2026-04-26 14:57:43','2026-04-26 14:57:56','2026-04-26 14:57:56',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(127,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"","dominant_color":"rgb(8, 40, 8)","vibrant_color":"#d9742b","blurhash":"LKE{E#0MK$%G~nEKkDoITvRQ,Haf","exif_data":null}',NULL,NULL,NULL,'uploads/especies/tomate-1777215480301.webp',140803,NULL,NULL,NULL,NULL,0,3,NULL,0,'2026-04-26 14:57:59','2026-04-26 15:01:23','2026-04-26 15:01:23',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(128,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"Tomates rojos maduros con gotas de agua en la planta, jardín soleado.","dominant_color":"rgb(8, 40, 8)","vibrant_color":"#d9742b","blurhash":"LKE{E#0MK$%G~nEKkDoITvRQ,Haf","exif_data":null}',NULL,NULL,NULL,'uploads/especies/tomates-rojos-maduros-con-gotas-de-agua-en-la-planta-jardin-soleado-1777215694707.webp',140803,NULL,NULL,NULL,NULL,0,3,NULL,1,'2026-04-26 15:01:33','2026-04-26 15:15:36',NULL,NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(129,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"Planta de tomate cherry en maceta con frutos rojos, naranjas y amarillos.","dominant_color":"rgb(8, 24, 8)","vibrant_color":"#d97e19","blurhash":"LJEVcW0Mt+-i~n9tt8WU%eM|xGi|","exif_data":null}',NULL,NULL,NULL,'uploads/especies/planta-de-tomate-cherry-en-maceta-con-frutos-rojos-naranjas-y-amarillos-1777215708198.webp',174469,NULL,NULL,NULL,NULL,0,4,NULL,0,'2026-04-26 15:01:47','2026-04-26 15:08:39','2026-04-26 15:08:39',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(130,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"Cortando un tomate kumato o negro en rodajas sobre tabla de madera.","dominant_color":"rgb(24, 24, 8)","vibrant_color":"#a43c16","blurhash":"LIHw}k00_N-6^jsp%2%19Y%g9ZI;","exif_data":null}',NULL,NULL,NULL,'uploads/especies/cortando-un-tomate-kumato-o-negro-en-rodajas-sobre-tabla-de-madera-1777215767654.webp',85040,NULL,NULL,NULL,NULL,0,5,NULL,0,'2026-04-26 15:02:46','2026-04-26 15:08:37','2026-04-26 15:08:37',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(131,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"Planta de tomate cherry en maceta con frutos de varios colores y madurez.","dominant_color":"rgb(8, 24, 8)","vibrant_color":"#d77e16","blurhash":"LIEL[s0Mt+-i~n9ttQWU%eM|xGi|","exif_data":null}',NULL,NULL,NULL,'uploads/especies/planta-de-tomate-cherry-en-maceta-con-frutos-de-varios-colores-y-madurez-1777216195522.webp',163494,NULL,NULL,NULL,NULL,0,4,NULL,1,'2026-04-26 15:09:55','2026-04-26 15:15:57',NULL,NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(132,'documento','application/pdf','Documento_Web','Poda y Entutorado del Tomate','',NULL,NULL,NULL,'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFdL0tEMEdVsPZyn_0L2ahpxUdjCYVC0trKa-hlL65JpetW8nqqtTzbnxqu-aJVJPxy4KaMpPGWDm-OBmEBohs_it-kWQHPDBbx6_5ctYpjCl7pXnrb4d8oKd_LB-nrp19ty_HOSttII2Yl4GZvQaaY2Y7nO1SrPqSoJuvM7_3k6Fw=',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-26 16:52:03','2026-04-26 16:52:55','2026-04-26 16:52:55',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(133,'documento','application/pdf','Documento_Web','Poda y entutorado del tomate','Este documento del Ministerio de Agricultura de España detalla las prácticas culturales esenciales para el cultivo intensivo de tomate, tanto en invernadero como al aire libre. Aporta metodologías específicas para la poda de formación, el despunte, el deshojado y el entutorado. Explica que la poda limita el número de tallos, lo que resulta en frutos de mayor calidad (tamaño, uniformidad de color, tersura) y mayor precocidad. También facilita las labores de cultivo, el control de plagas y enfermedades, y la recolección. Se describen métodos de poda como dejar uno o dos tallos principales y eliminar los brotes axilares, así como técnicas específicas como la "poda Curro" y la "poda en candelabro". Además, aborda los sistemas de entutorado con cuerdas o alambres en invernaderos y el tradicional "caballete", señalando sus ventajas y desventajas.',NULL,NULL,NULL,'https://web.archive.org/web/2/https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHgMh-cMAXxM4eK7A2-YSowLyz22hiyx38RfLVPn920uJEtypnsozsxt0ksF6RpeuGdr5vRCKlHeHiIWNRZgcJtC1PZDsiz8No8geOS9UNBiMCLbs5kqce3GrelWLnwMtC6p2daXpx5zMllHBDVu3qlSIcnPsflDJIiFXE6ZKn5DM0t',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-26 17:02:57','2026-04-26 17:10:40','2026-04-26 17:10:40',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(134,'documento','application/pdf','Documento_Web','Poda y entutorado del tomate','Este documento, parte de las "Hojas Divulgadoras del Ministerio de Agricultura" de España, se centra en las técnicas de poda y entutorado necesarias para el cultivo intensivo de tomate, tanto en invernadero como al aire libre. Describe el "destallado" o "desbrote" como una operación fundamental para limitar el número de tallos, lo que resulta en una mayor precocidad, frutos de mayor tamaño, mejor uniformidad de color, mayor tersura y limpieza, facilidad en las prácticas de cultivo, mejor control de plagas y enfermedades, y mayor rapidez en la recolección. El manual detalla diferentes formas de poda, incluyendo la eliminación de brotes axilares dejando uno o dos tallos principales, y la poda del "curro". También aborda los factores que influyen en el número de brazos a dejar (marco de plantación, precocidad deseada, mano de obra, variedad y clima) y presenta diversos sistemas de entutorado.','',NULL,NULL,'https://web.archive.org/web/2/https://www.mapa.gob.es/ministerio/pags/biblioteca/hojas/hd_1973_1974_19.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-26 17:39:04','2026-04-26 17:39:23','2026-04-26 17:39:23',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(135,'documento','application/pdf','Documento_Web','Poda y entutorado del tomate','Este documento, parte de las "Hojas Divulgadoras del Ministerio de Agricultura" de España, se centra en las técnicas de poda y entutorado necesarias para el cultivo intensivo de tomate, tanto en invernadero como al aire libre. Describe el "destallado" o "desbrote" como una operación fundamental para limitar el número de tallos, lo que resulta en una mayor precocidad, frutos de mayor tamaño, mejor uniformidad de color, mayor tersura y limpieza, facilidad en las prácticas de cultivo, mejor control de plagas y enfermedades, y mayor rapidez en la recolección. El manual detalla diferentes formas de poda, incluyendo la eliminación de brotes axilares dejando uno o dos tallos principales, y la poda del "curro". También aborda los factores que influyen en el número de brazos a dejar (marco de plantación, precocidad deseada, mano de obra, variedad y clima) y presenta diversos sistemas de entutorado.','',NULL,NULL,'https://web.archive.org/web/2/https://www.mapa.gob.es/ministerio/pags/biblioteca/hojas/hd_1973_1974_19.pdf',0,NULL,NULL,NULL,NULL,0,2,NULL,0,'2026-04-26 17:39:04','2026-04-26 17:39:21','2026-04-26 17:39:21',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(136,'documento','application/pdf','Documento_Web','mapa.gob.es','Este documento de la Extensión Cooperativa de Alabama (Alabama Cooperative Extension System) proporciona técnicas de poda para la producción de tomates frescos, con el objetivo de lograr plantas más saludables y frutos de mayor tamaño. Explica que la poda ayuda a mantener un equilibrio entre el crecimiento vegetativo y reproductivo, evitando el crecimiento excesivo del follaje que podría reducir el tamaño del fruto. Recomienda la poda moderada para obtener vides más pequeñas y frutos más grandes que maduran antes, además de mantener las plantas y frutos alejados del suelo para controlar enfermedades. El método más común descrito es la poda a dos tallos, eliminando los brotes laterales (chupones) que aparecen en las axilas de cada hoja, especialmente los que se encuentran inmediatamente debajo del primer racimo floral. Se aconseja eliminar los chupones cuando son pequeños (no más de 2 a 4 pulgadas de longitud) para evitar el desperdicio de energía de la planta y reducir los puntos de entrada para patógenos. También se recomienda podar temprano en la mañana, después de que las plantas se hayan secado.','',NULL,NULL,'https://web.archive.org/web/2/https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGIZRjB6p-RMJQSIrqZRmkmIzA_Qp1uvI_VqZQx5doWEB_T-AWTxIKa5IbDrDM4F8dyRUvovFiXRLOljznwiR1uOezIkz6_-cLDBhc8bXLy4WzfdNcwEGF6HC6z9tfSXomjXKKHFUForVYWiUJnUwWcyLv1iNRrStHcksZhSMZGDQg=',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-26 17:44:00','2026-04-26 17:45:50','2026-04-26 17:45:50',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(137,'documento','application/pdf','Documento_Web','mapa.gob.es','Informe técnico del INTA (Argentina) que aborda las prácticas culturales esenciales de conducción y poda en el cultivo de tomate, destacando su importancia para la rentabilidad, la calidad del fruto y el control de plagas y enfermedades en sistemas intensivos.','- **Contexto:** El cultivo intensivo de tomate (en invernadero o al aire libre) requiere prácticas culturales específicas para obtener una buena producción y rentabilidad.\n- **Prácticas imprescindibles:** Poda o destallado, despunte o pinzamiento de los tallos, deshojado o limpieza de hojas, y entutorado o enrame.\n- **Poda o destallado:**\n  - **Objetivo:** Encauzar el desarrollo de la vegetación, limitar el número de tallos y, por tanto, la cantidad de fruto por planta, a cambio de una mayor precocidad.\n  - **Ventajas:** Mayor calidad de los frutos (mayor tamaño, uniformidad de color, más tersos y limpios), mayor facilidad en las prácticas de cultivo, mejor control de plagas y enfermedades, mayor rapidez y comodidad en la recolección, y aumento de la producción por unidad de superficie (al cultivar más plantas).\n  - **Inconvenientes:** Excesiva mano de obra.\n  - **Método:** Consiste en dejar varios tallos guía y cortar todos los brotes que salen en las axilas de las hojas de esos tallos.\n- **Formas de poda:**\n  - **Poda normal (más usada):** Se deja el tallo principal y uno o dos hijos que brotan en las axilas de las hojas de ese tallo; se desbrotan todos los hijuelos que salen en los dos o tres brazos que se dejan.\n  - **Poda "Curro":** Se dejan uno o dos tallos que se deshijan a medida que la planta crece, y se deja otro tallo denominado "curro" al cual se le despuntan o cortan la yema terminal inmediatamente después de formado el primer racimo de flores.\n  - **Poda en candelabro simple:** Se describe un esquema donde la planta queda con dos tallos principales y dos secundarios.\n- **Despunte o pinzamiento:** Se refiere a cortar la yema terminal de los tallos para detener su crecimiento y fomentar el desarrollo de frutos existentes.\n- **Deshojado:** Eliminación de hojas, especialmente las inferiores o enfermas, para mejorar la aireación y reducir la incidencia de plagas y enfermedades.',NULL,NULL,'https://web.archive.org/web/2/https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFdPOERc1H33iokpp7j3HtbCxdW-bQ9pV5_RCW4M2IP4-CiNUyGF1Ar5HN7diKs8mJUPE3vBOwtsa5UHAMvvHZ0ldfjFI1CoTgzhqWd-CQcTGvLM-2YUJMRcNBOeYa9kJ-GiLEsU5QtUDoE9KtMt55kbs5VRHSw_vII3mvUq9dSDlal',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-26 17:46:49','2026-04-26 17:48:56','2026-04-26 17:48:56',NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(138,'documento','application/pdf','Documento_Web','mapa.gob.es','Este documento del Ministerio de Agricultura detalla las técnicas de poda y destallado en el cultivo intensivo de tomate, tanto en invernadero como al aire libre, buscando optimizar la producción y calidad del fruto.','Apuntes de estudiante:\n*   La poda o destallado es una práctica cultural imprescindible en el cultivo intensivo de tomate para asegurar la rentabilidad.\n*   Su objetivo principal es encauzar el desarrollo vegetativo, limitando el número de tallos para lograr mayor precocidad y una mejor calidad de los frutos (mayor tamaño, uniformidad de color, tersura y limpieza).\n*   Entre las ventajas adicionales se incluyen: mayor facilidad en las prácticas de cultivo, mejor control de plagas y enfermedades, mayor rapidez y comodidad en la recolección, y un aumento de la producción por unidad de superficie.\n*   El principal inconveniente es la considerable mano de obra que requiere esta práctica y las operaciones asociadas como el entutorado.\n*   Se describen diferentes formas de poda:\n    *   **Poda normal:** Consiste en dejar el tallo principal y uno o dos hijos que brotan de las axilas de las hojas de ese tallo, eliminando todos los demás hijuelos.\n    *   **Poda \'Curro\':** Se dejan uno o dos tallos principales y un tallo adicional denominado \'curro\', al cual se le despuntará la yema terminal inmediatamente después de la formación del primer racimo de flores.\n    *   **Poda en candelabro simple:** La planta se configura para tener dos tallos principales y dos secundarios.\n*   El destallado implica dejar varios tallos guía y cortar todos los brotes que emergen de las axilas de las hojas de esos tallos.\n*   Se autoriza la reproducción íntegra de la publicación mencionando su origen: «Hojas Divulgadoras del Ministerio de Agricultura».',NULL,NULL,'https://web.archive.org/web/2/https://www.mapa.gob.es/ministerio/pags/biblioteca/hojas/hd_1973_19.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,1,'2026-04-26 17:49:39',NULL,NULL,NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(139,'documento','application/pdf','Documento_Web','icta.gob.gt','Este manual del Instituto de Ciencia y Tecnología Agrícolas (ICTA) de Guatemala ofrece recomendaciones técnicas para el cultivo de tomate bajo invernadero, incluyendo pautas específicas para la frecuencia de poda según las condiciones climáticas.','Apuntes de estudiante:\n*   El manual es el resultado de la colaboración entre el Ministerio de Agricultura Ganadería y Alimentación (MAGA) de Guatemala, el ICTA y la Agencia de Cooperación Internacional del Japón (JICA).\n*   Proporciona recomendaciones técnicas para el cultivo de tomate, papa, frijol y haba bajo invernadero, con el fin de mejorar la producción de alimentos y la seguridad alimentaria de las comunidades rurales.\n*   **Frecuencia de poda del tomate según el clima:**\n    *   En condiciones frías del altiplano, se recomienda podar el tomate una vez a la semana.\n    *   En climas templados, la frecuencia de poda aumenta a dos veces por semana.\n*   Es crucial que los brotes axilares a podar tengan una longitud de 2.5 a 5 centímetros.\n*   Las variedades de tomate a las que se refieren estas recomendaciones son de hábito de crecimiento indeterminado, lo que significa que continúan su crecimiento después de la floración con una guía.',NULL,NULL,'https://web.archive.org/web/2/https://www.icta.gob.gt/publicaciones/Frijol/Manual%20cultivos.pdf',0,NULL,NULL,NULL,NULL,0,2,NULL,1,'2026-04-26 17:50:35',NULL,NULL,NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(140,'documento','application/pdf','Documento_Web','fao.org','Este manual de la FAO y CORPOICA detalla las Buenas Prácticas Agrícolas para la producción de tomate en condiciones protegidas, haciendo énfasis en la poda de variedades de crecimiento indeterminado para optimizar la producción y calidad del fruto.','Apuntes de estudiante:\n*   El manual se centra en la implementación de Buenas Prácticas Agrícolas (BPA) en sistemas de producción de tomate bajo condiciones protegidas, abarcando desde la preparación del terreno hasta la cosecha y el embalaje.\n*   Para materiales de tomate de crecimiento indeterminado, la poda es una práctica fundamental que se realiza en diversas partes de la planta, incluyendo tallos, chupones, hojas, flores y frutos.\n*   **Los objetivos de la poda son:**\n    *   Crear mejores condiciones para las partes de la planta que están directamente relacionadas con la producción.\n    *   Eliminar aquellas partes que no contribuyen a la cosecha y que, por el contrario, consumen energía que podría destinarse al desarrollo de frutos.\n    *   Contribuir a la obtención de frutos de mayor tamaño y calidad.\n*   La implementación de estas BPA contribuye al desarrollo de políticas de producción más limpia y al desarrollo rural.\n*   Este documento es una colaboración entre la Organización de las Naciones Unidas para la Alimentación y la Agricultura (FAO), la Gobernación de Antioquia, MANA y la Corporación Colombiana de Investigación Agropecuaria (CORPOICA).',NULL,NULL,'https://web.archive.org/web/2/https://www.fao.org/4/a1374s/a1374s00.pdf',0,NULL,NULL,NULL,NULL,0,3,NULL,1,'2026-04-26 17:51:10',NULL,NULL,NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(141,'documento','application/pdf','Documento_Web','platicar.go.cr','Esta guía técnica del Instituto Nacional de Innovación y Transferencia en Tecnología Agropecuaria (INTA) de Costa Rica aborda el cultivo de tomate, incluyendo la poda de follaje o saneamiento y la poda apical, destacando su importancia para el desarrollo óptimo y la calidad de los racimos.','Apuntes de estudiante:\n*   La guía técnica es elaborada por el Instituto Nacional de Innovación y Transferencia en Tecnología Agropecuaria (INTA) de Costa Rica.\n*   Se describen dos tipos principales de poda:\n    *   **Poda de follaje o saneamiento:** Consiste en la eliminación de hojas dañadas, viejas o enfermas para mantener la sanidad general de la planta y mejorar la aireación.\n    *   **Poda apical:** Implica la poda del eje principal en híbridos y/o variedades de tomate de crecimiento indeterminado.\n*   La poda apical es una práctica que propicia la precocidad del cultivo y favorece un mayor tamaño en los racimos que se encuentran en desarrollo.\n*   Es de suma importancia retirar los restos de poda del campo de cultivo para prevenir la diseminación de posibles enfermedades.\n*   En general, la poda es una práctica común en variedades de crecimiento indeterminado, donde se seleccionan dos o tres tallos principales y se podan los demás.\n*   Se recomienda encarecidamente desinfectar los instrumentos utilizados para la poda como medida preventiva contra la propagación de enfermedades.',NULL,NULL,'https://web.archive.org/web/2/http://platicar.go.cr/images/buscador/documents/pdf/2021/Tomate_Edit.pdf',0,NULL,NULL,NULL,NULL,0,4,NULL,1,'2026-04-26 17:51:24',NULL,NULL,NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(142,'documento','application/pdf','Documento_Web','una.edu.ni','Documento técnico encontrado en internet vía Google Search.','',NULL,NULL,'https://web.archive.org/web/2/https://cenida.una.edu.ni/relectronicos/RENF01CH517t.pdf',0,NULL,NULL,NULL,NULL,0,5,NULL,1,'2026-04-26 17:51:43',NULL,NULL,NULL,3,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(143,'imagen','image/png','calabacin.png',NULL,'{}',NULL,NULL,NULL,'especies/calabacin_icon.png',10784,NULL,NULL,NULL,NULL,0,0,NULL,0,'2026-04-27 11:37:13','2026-04-27 15:45:43','2026-04-27 12:02:24',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(144,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":65.66520979020979,"profile_object_y":58.47727272727273,"profile_object_zoom":106,"profile_brightness":100,"profile_contrast":100,"profile_style":"","seo_alt":""}',NULL,NULL,NULL,'https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/especies/calabacin-1777291475736.webp',191925,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-27 12:04:40','2026-04-27 15:45:43','2026-04-27 12:11:19',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(145,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"","dominant_color":"rgb(8, 8, 8)","vibrant_color":"#ddb421","blurhash":"LMD^6-WZRS$y_MbcM~s9.9j1RnWT","exif_data":null}',NULL,NULL,NULL,'https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/especies/calabacin-1777291523553.webp',201146,NULL,NULL,NULL,NULL,0,2,NULL,0,'2026-04-27 12:05:26','2026-04-27 12:11:40','2026-04-27 12:11:40',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(146,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":63.93733307148468,"profile_object_y":92.21946190102122,"profile_object_zoom":134,"profile_brightness":100,"profile_contrast":100,"profile_style":"","seo_alt":"Calabacín verde en planta con flores amarillas y hojas grandes en huerto."}',NULL,NULL,NULL,'uploads/especies/calabacin-verde-en-planta-con-flores-amarillas-y-hojas-grandes-en-huerto-1777292668749.webp',191925,NULL,NULL,NULL,NULL,0,2,NULL,1,'2026-04-27 12:24:32','2026-05-02 21:39:35',NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(147,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"Calabacín verde con gotas de agua, flores amarillas y hojas en un huerto.","dominant_color":"rgb(8, 8, 8)","vibrant_color":"#d9ac16","blurhash":"LHB;KsOWR.-T_KIVIExF-;RQNyxZ","exif_data":null}',NULL,NULL,NULL,'uploads/especies/calabacin-verde-con-gotas-de-agua-flores-amarillas-y-hojas-en-un-huerto-1777293492006.webp',192475,NULL,NULL,NULL,NULL,0,4,NULL,1,'2026-04-27 12:38:18','2026-05-02 21:39:35',NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(148,'imagen','image/jpeg','blob',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"Calabacines frescos, algunos cortados, con flores y tomates en cocina.","dominant_color":"rgb(72, 40, 8)","vibrant_color":"#b72b07","blurhash":"LFGbL-_4RO-7_N_2MxMd-q?uIpM{","exif_data":null}',NULL,NULL,NULL,'uploads/especies/calabacines-frescos-algunos-cortados-con-flores-y-tomates-en-cocina-1777310811906.webp',514661,NULL,NULL,NULL,NULL,0,3,NULL,1,'2026-04-27 17:26:57','2026-05-02 19:03:45',NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(149,'imagen','image/jpeg','17773129376631444782729221830632.jpg',NULL,'{"profile_object_x":43.58762650637282,"profile_object_y":45.47422857382862,"profile_object_zoom":140,"profile_brightness":100,"profile_contrast":100,"profile_style":""}',NULL,NULL,NULL,'uploads/usuario/usuario_1_1777312944664.jpg',3587011,NULL,NULL,NULL,NULL,1,5,NULL,1,'2026-04-27 18:02:30','2026-05-03 08:39:44',NULL,1,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(150,'imagen','image/jpeg','ai-generated-1777371923514.jpg',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"Planta de calabacín con frutos verdes, flores amarillas y hojas mojadas.","dominant_color":"rgb(8, 8, 8)","vibrant_color":"#8dba1d","blurhash":"LJAxPKtQN2tO.joyV[j=MzjuaKWB","exif_data":{}}',NULL,NULL,NULL,'https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/especies/planta-de-calabacin-con-frutos-verdes-flores-amarillas-y-hojas-mojadas-1777371929030.webp',1958634,NULL,NULL,NULL,NULL,0,4,NULL,0,'2026-04-28 10:25:32','2026-04-28 10:25:46','2026-04-28 10:25:46',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(151,'imagen','image/jpeg','ai-generated-1777372018491.jpg',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"Rodajas de calabacín fresco con pasta y quinoa en un plato blanco.","dominant_color":"rgb(216, 216, 216)","vibrant_color":"#e9b926","blurhash":"LoK-OFn#tSs:t7Rjaxaz.AR*WAf,","exif_data":{}}',NULL,NULL,NULL,'uploads/especies/rodajas-de-calabacin-fresco-con-pasta-y-quinoa-en-un-plato-blanco-1777372022253.webp',1292017,NULL,NULL,NULL,NULL,1,4,NULL,1,'2026-04-28 10:27:04','2026-05-02 21:39:35',NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(152,'imagen','image/jpeg','ai-generated-labor-1777373554005.jpg',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"Sistema de riego por pivote central regando un campo de cultivo verde.","dominant_color":"rgb(216, 216, 216)","vibrant_color":"#acb008","blurhash":"LrJ8kcNHRjof_4Rkayj[9GWBoej?","exif_data":{}}',NULL,NULL,NULL,'uploads/labores/sistema-de-riego-por-pivote-central-regando-un-campo-de-cultivo-verde-1777373557050.webp',1859552,NULL,NULL,NULL,NULL,0,2,NULL,1,'2026-04-28 10:52:40','2026-04-29 10:19:38',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1);
INSERT INTO `datosadjuntos` VALUES(153,'imagen','image/jpeg','ai-generated-labor-1777373588214.jpg',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"Grifo regando plántulas de tomate en un campo, labor agrícola.","dominant_color":"rgb(8, 8, 8)","vibrant_color":"#829a0e","blurhash":"L5AA,1.101?aywo]xwxt8;M+k6WB","exif_data":{}}',NULL,NULL,NULL,'uploads/labores/grifo-regando-plantulas-de-tomate-en-un-campo-labor-agricola-1777373591957.webp',1691693,NULL,NULL,NULL,NULL,0,3,NULL,1,'2026-04-28 10:53:15','2026-04-29 10:19:38',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1);
INSERT INTO `datosadjuntos` VALUES(154,'imagen','image/jpeg','ai-generated-labor-1777373613571.jpg',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"Agua de riego fluyendo por un canal de piedra sinuoso en tierra fértil.","dominant_color":"rgb(8, 8, 8)","vibrant_color":"#a28e2f","blurhash":"L7A0:f=#00NE~mxIS6tPIttRxuow","exif_data":{}}',NULL,NULL,NULL,'uploads/labores/agua-de-riego-fluyendo-por-un-canal-de-piedra-sinuoso-en-tierra-fertil-1777373618526.webp',1759077,NULL,NULL,NULL,NULL,1,4,NULL,1,'2026-04-28 10:53:41','2026-04-29 10:19:38',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1);
INSERT INTO `datosadjuntos` VALUES(155,'imagen','image/jpeg','ai-generated-labor-1777373672283.jpg',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"Agua de riego brotando de una tubería metálica, creando salpicaduras.","dominant_color":"rgb(8, 8, 8)","vibrant_color":"#97663d","blurhash":"L3BDWrDh00t7z-x[?w%MK7t7Na_N","exif_data":{}}',NULL,NULL,NULL,'uploads/labores/agua-de-riego-brotando-de-una-tuberia-metalica-creando-salpicaduras-1777373677086.webp',1694567,NULL,NULL,NULL,NULL,0,1,NULL,1,'2026-04-28 10:54:39','2026-04-29 10:19:38',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1);
INSERT INTO `datosadjuntos` VALUES(156,'imagen','image/jpeg','ai-generated-labor-1777373702524.jpg',NULL,'{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","seo_alt":"Chorro de agua cayendo y salpicando, representando el riego agrícola.","dominant_color":"rgb(40, 40, 24)","vibrant_color":"#b48a4a","blurhash":"L29a59_300bw00D%$%RO.At7Ioay","exif_data":{}}',NULL,NULL,NULL,'https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/labores/chorro-de-agua-cayendo-y-salpicando-representando-el-riego-agricola-1777373707141.webp',1501075,NULL,NULL,NULL,NULL,0,5,NULL,0,'2026-04-28 10:55:09','2026-04-28 10:55:25','2026-04-28 10:55:25',NULL,NULL,NULL,NULL,NULL,NULL,1);
INSERT INTO `datosadjuntos` VALUES(157,'documento','application/pdf','Documento_Web','scribd.com','Documento técnico del Dr. Francisco Camacho Ferre del Departamento de Producción Vegetal de la Universidad de Almería sobre el cultivo del calabacín bajo invernadero, abordando la morfología, fisiología y exigencias ambientales, incluyendo la producción de plántulas.','Apuntes sobre el semillero de calabacín en invernadero:\n*   **Morfología de la plántula**: Se menciona la \'Plántula desarrollada en bandeja de semillero\' como parte de la morfología de los órganos vegetativos y productivos del calabacín.\n*   **Germinación**: El documento cubre la germinación como un proceso fisiológico clave en el desarrollo de la planta.\n*   **Ciclo de producción**: El calabacín entra en producción en un periodo de 35 a 55 días desde la siembra.\n*   **Exigencias climáticas**: El calabacín es menos exigente en altas temperaturas que otras cucurbitáceas como el melón o el pepino, pero es sensible a los fríos y las heladas. La temperatura óptima de germinación se sitúa entre 20-25°C.\n*   **Humedad óptima**: La humedad relativa óptima para el cultivo del calabacín en invernadero oscila entre el 65% y el 80%.',NULL,NULL,'https://web.archive.org/web/2/https://es.scribd.com/document/358661619/Ficha-Tecnica-Calabacin',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-29 10:48:43','2026-04-29 10:56:48','2026-04-29 10:56:48',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(158,'documento','application/pdf','Documento_Web','uky.edu','Manual sobre el cultivo intensivo del calabacín que aborda aspectos botánicos, exigencias climáticas, abonado y, de manera relevante, las enfermedades producidas por hongos como el oídio y la roña (Cladosporium cucumerinum).','-   **Generalidades del cultivo:** El calabacín (*Cucurbita pepo*) es una planta anual de vegetación compacta y crecimiento indeterminado, cultivada en ciclos cortos (otoño o primavera).\n-   **Exigencias climáticas:** Prefiere climas templados o cálidos, sensible a fríos y heladas. Temperatura óptima para floración entre 20°C (noche) y 25°C (día). Humedad óptima en invernadero entre 65% y 80%.\n-   **Suelo:** Profundo, fresco, bien drenado y rico en materia orgánica.\n-   **Enfermedades fúngicas:**\n    -   **Oídio:** Muy extendida y de fácil diagnóstico. Afecta a toda la planta, especialmente hojas (haz y envés). Causada por *Erysiphe cichoracearum* y *Sphaerotheca fuliginia*. Produce manchas aisladas y circulares con micelio blanco pulverulento.\n    -   **Roña (Sarna):** Causada por el hongo *Cladosporium cucumerinum*. Se refugia en restos de plantas enfermas y se propaga por semillas y restos vegetales.\n    -   **Síntomas de Roña en frutos:** Manchas deprimidas con exudación que se recubre con una masa de esporas.\n-   **Manejo de enfermedades:** La prevención es clave. Rotación de cultivos, fertilización adecuada, eliminación de plantas viejas y hojas enfermas. Evitar el exceso de humedad favorece la aparición de enfermedades fúngicas.\n-   **Otras enfermedades mencionadas en el contexto de cucurbitáceas (no específicas de este documento para calabacín pero relevantes):** Pudrición radicular (*Phoma, Fusarium, Sclerotinia*), mildiu velloso (*Pseudoperonospora cubensis*), botrytis (*Botrytis cinerea*), virus del mosaico amarillo del calabacín, virus del mosaico del pepino, mancha bacteriana de la hoja (*Xanthomonas campestris*).',NULL,NULL,'https://web.archive.org/web/2/https://plantpathology.mgcafe.uky.edu/sites/plantpathology.ca.uky.edu/files/PPFS-VG-10-S.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-29 10:57:40','2026-04-29 10:59:30','2026-04-29 10:59:30',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(159,'documento','application/pdf','Documento_Web','uky.eduf','Documento técnico encontrado en internet vía Google Search.','',NULL,NULL,'https://web.archive.org/web/2/https://publications.mgcafe.uky.edu/sites/publications.ca.uky.edu/files/ID91s.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-29 11:07:16','2026-04-29 11:12:58','2026-04-29 11:12:58',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(160,'documento','application/pdf','Documento_Web','','','',NULL,'/api/media?path=uploads%2Fespecies_pdfs_covers%2Fcover_10_160_1777461307113.jpg','https://web.archive.org/web/2/https://redhuertosalicante.files.wordpress.com/2019/05/calabacc38dn.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-29 11:14:54','2026-04-29 11:17:34','2026-04-29 11:17:34',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(161,'documento','application/pdf','Documento_Web','','','',NULL,'/api/media?path=uploads%2Fespecies_pdfs_covers%2Fcover_10_161_1777461499632.jpg','https://web.archive.org/web/2/https://www.mapa.gob.es/ministerio/pags/biblioteca/hojas/hd_1973_07.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-29 11:18:06','2026-04-29 11:22:30','2026-04-29 11:22:30',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(162,'documento','application/pdf','Documento_Web','','','',NULL,'/api/media?path=uploads%2Fespecies_pdfs_covers%2Fcover_10_162_1777461818160.jpg','https://web.archive.org/web/2/https://www.procam.bio/wp-content/uploads/2023/10/calabacin_tcm30-102356.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-29 11:23:26','2026-04-29 11:30:13','2026-04-29 11:30:13',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(163,'documento','application/pdf','Documento_Web','','','',NULL,'/api/media?path=uploads%2Fespecies_pdfs_covers%2Fcover_10_163_1777462616723.jpg','https://web.archive.org/web/2/https://www.mapa.gob.es/ministerio/pags/biblioteca/hojas/hd_1995_01-02.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-29 11:36:35','2026-04-29 13:14:34','2026-04-29 13:14:34',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(164,'documento','application/pdf','Documento_Web','Poda de Hortalizas en Invernaderos','Documento técnico del Ministerio de Agricultura, Pesca y Alimentación de España que aborda la poda en cultivos hortícolas intensivos en invernadero, incluyendo el calabacín.','- La poda en cultivos hortícolas intensivos en invernadero busca encauzar el crecimiento para una mayor rentabilidad, especialmente en marcos de plantación estrechos.\n- El objetivo general es dejar uno o varios tallos, eliminando brotes, hojas, frutos y chupones que no fructifican o tienen un desarrollo excesivo.\n- Se puede utilizar un código de 3 cifras para indicar el tipo de poda (ej. 2-8-2 para número de brazos, hojas por encima de ramos de 2º orden y hojas por encima de tallos de 3º orden).\n- La poda debe ser racional y con un criterio económico, adaptándose a la especie, marco de plantación, forma de vegetar, fructificar y climatología.',NULL,NULL,'https://web.archive.org/web/2/https://es.scribd.com/document/135961428/calabacin-cladosporium',0,NULL,NULL,NULL,NULL,0,2,NULL,0,'2026-04-29 12:30:07','2026-04-29 13:14:32','2026-04-29 13:14:32',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(165,'documento','application/pdf','Documento_Web','','','',NULL,'/api/media?path=uploads%2Fespecies_pdfs_covers%2Fcover_10_165_1777470604674.jpg','https://web.archive.org/web/2/https://www.olivosdebadajoz.com/PLANTAS-DE-HORTALIZA/Calabacin.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-29 13:49:49','2026-04-29 13:58:42','2026-04-29 13:58:42',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(166,'documento','application/pdf','Documento_Web','Poda de Hortalizas en Invernadero (Calabacín)','Guía del Ministerio de Agricultura sobre técnicas de poda para hortalizas en invernadero, con sección específica para calabacín.','Detalla poda de flores, frutos y hojas envejecidas o dañadas. Menciona aclareo de frutos para mejorar calidad y poda de yemas/brotes terminales (pinzamiento/despunte) para favorecer órganos de producción. También aborda el destallado.',NULL,'/api/media?path=uploads%2Fespecies_pdfs_covers%2Fcover_10_166_1777473117207.jpg','https://web.archive.org/web/2/https://www.mapa.gob.es/ministerio/pags/biblioteca/hojas/hd_1995_01-02.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-29 14:31:36','2026-04-29 14:35:31','2026-04-29 14:35:31',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(167,'documento','application/pdf','Documento_Web','Poda de Hortalizas en Invernadero (Calabacín)','Este documento del Ministerio de Agricultura, Pesca y Alimentación detalla las técnicas de poda aplicadas a hortalizas en invernadero, con un enfoque específico en el calabacín. Aborda la poda de formación, sugiriendo la poda a dos brazos para fomentar el desarrollo de guías secundarias, y la poda de brotes, recomendando la eliminación de brotes secundarios que surgen por exceso de abonado nitrogenado. También cubre la poda de hojas para mejorar la aireación y reducir enfermedades, y el aclareo de frutos para optimizar la calidad y el tamaño de los restantes, eliminando los dañados o deformes.','- No se acostumbra poda de formación, pero se puede ensayar la poda a dos brazos cortando el tallo principal tras dos hojas verdaderas.\n- Eliminar brotes secundarios que aparecen por exceso de abonado nitrogenado para evitar frutos no comerciales.\n- Realizar poda de hojas (deshojado) para mejorar la aireación, reducir enfermedades y facilitar labores, evitando cortar hojas superiores que protegen los frutos.',NULL,'/api/media?path=uploads%2Fespecies_pdfs_covers%2Fcover_10_167_1777473376143.jpg','https://web.archive.org/web/2/https://www.mapa.gob.es/ministerio/pags/biblioteca/hojas/hd_1995_01-02.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-29 14:36:02','2026-04-29 14:39:52','2026-04-29 14:39:52',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(168,'documento','application/pdf','Documento_Web','Poda de Hortalizas en Invernadero: Calabacín','Este documento del Ministerio de Agricultura, Pesca y Alimentación aborda la poda en cultivos hortícolas intensivos bajo invernadero, con un enfoque específico en el calabacín. Detalla cómo la poda es fundamental para regular el crecimiento y la productividad, mejorando la aireación de la planta y facilitando las labores culturales. Se enfatiza la eliminación de hojas envejecidas o dañadas para reducir la incidencia de enfermedades criptogámicas y plagas, aunque se advierte sobre el aumento de mano de obra y el riesgo de botrytis en los cortes. Se describen métodos para el aclareo de frutos y la poda de yemas y brotes terminales para optimizar la calidad y el número de frutos.','La poda en calabacín elimina flores, frutos, hojas y brotaciones secundarias para mejorar la aireación y reducir enfermedades criptogámicas.\nSe facilitan las prácticas culturales al eliminar masa foliar y se reducen focos de plagas al suprimir hojas dañadas o enfermas.\nInconvenientes de la poda incluyen un mayor aporte de mano de obra y la posibilidad de ataque de botrytis sobre los cortes efectuados.\nEl deshojado se realiza dando cortes limpios en la unión del peciolo con el tallo, siempre por debajo de los frutos más bajos, evitando podar las hojas superiores para no desproteger los frutos del sol.\nSe puede practicar una poda intermedia para regularizar la producción y desarrollo, pinzando brotes laterales a 1 fruto entre 0.60-1.5 m de altura, y despuntando tallos laterales a 2 frutos a partir de 1.5 m.',NULL,'/api/media?path=uploads%2Fespecies_pdfs_covers%2Fcover_10_168_1777473666939.jpg','https://web.archive.org/web/2/https://www.mapa.gob.es/ministerio/pags/biblioteca/hojas/hd_1995_01-02.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-29 14:40:48','2026-04-30 13:49:03','2026-04-30 13:49:03',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(169,'documento','application/pdf','Documento_Web','Poda de Hortalizas en Invernadero (Calabacín)','Este documento del Ministerio de Agricultura, Pesca y Alimentación, se centra en las técnicas de poda aplicadas a cultivos hortícolas intensivos bajo invernadero, con una sección dedicada al calabacín. Detalla la importancia de eliminar hojas envejecidas o con desarrollo excesivo para optimizar la luminosidad y la circulación del aire dentro de la planta, lo cual es crucial para la prevención de enfermedades fúngicas. Además, aborda la supresión de brotes secundarios y el aclareo de frutos, prácticas esenciales para mejorar la calidad y el rendimiento de la cosecha, siempre enfatizando la necesidad de realizar cortes limpios para minimizar el riesgo de infecciones.','La poda en calabacín implica la eliminación de flores, frutos, hojas y brotaciones secundarias, especialmente en variedades que muestran un desarrollo excesivo.\nUno de los objetivos principales es mejorar la aireación de la planta, lo que disminuye significativamente las condiciones favorables para el ataque de enfermedades criptogámicas como el oídio.\nLa supresión de hojas dañadas o enfermas es fundamental para reducir los focos de penetración y desarrollo de plagas y enfermedades aéreas, contribuyendo a la sanidad general del cultivo.\nComo inconvenientes de la poda, se mencionan el mayor aporte de mano de obra y la posibilidad de ataques de Botrytis sobre los cortes realizados, lo que requiere precauciones post-poda.\nEl deshojado se justifica cuando las hojas de la parte baja de la planta están muy envejecidas o su excesivo desarrollo dificulta la luminosidad y aireación, debiendo realizarse cortes limpios en la unión del peciolo con el tallo, siempre por debajo de los frutos más bajos.',NULL,'/api/media?path=uploads%2Fespecies_pdfs_covers%2Fcover_10_169_1777557022647.jpg','https://web.archive.org/web/2/https://www.mapa.gob.es/ministerio/pags/biblioteca/hojas/hd_1995_01-02.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-30 13:50:04','2026-04-30 13:56:29','2026-04-30 13:56:29',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(170,'documento','application/pdf','Documento_Web','Poda de Hortalizas en Invernadero: Calabacín','Este manual del Ministerio de Agricultura, Pesca y Alimentación detalla las técnicas de poda aplicables al calabacín en cultivos de invernadero. Se enfoca en la eliminación de brotes secundarios no comerciales, el deshojado de hojas envejecidas o dañadas para mejorar la aireación y luminosidad, y la supresión de frutos enfermos o deformados. La poda busca optimizar la producción y la sanidad de la planta, reduciendo la incidencia de enfermedades criptogámicas y facilitando las labores culturales, aunque advierte sobre la posible reducción de la producción si se excede en el corte.','La poda en calabacín elimina flores, frutos y hojas, así como brotaciones secundarias que pueden surgir por un desarrollo excesivo o en variedades específicas.\nEl deshojado se justifica en hojas muy envejecidas o cuando su excesivo desarrollo dificulta la luminosidad y aireación interna de la planta.\nLos cortes para el deshojado deben ser limpios, realizados en la unión del peciolo con el tallo, siempre por debajo de los frutos más bajos, preferentemente por la mañana y con ambiente seco.\nNo se deben eliminar las hojas superiores, ya que esto puede exponer los frutos al sol, causando daños y endurecimiento.\nTras una poda intensa de hojas, se recomienda aplicar un tratamiento fungicida (anti-botrytis) para prevenir infecciones en los cortes.\nLa supresión de brotes secundarios es crucial en variedades híbridas que, con un abonado nitrogenado excesivo, pueden producir frutos no comerciales.\nSe deben suprimir los frutos dañados por plagas o enfermedades, deformados o excesivamente desarrollados que no sean comerciales.',NULL,'/api/media?path=uploads%2Fespecies_pdfs_covers%2Fcover_10_170_1777557437454.jpg','https://web.archive.org/web/2/https://www.mapa.gob.es/ministerio/pags/biblioteca/hojas/hd_1995_01-02.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-30 13:57:02','2026-04-30 13:57:29','2026-04-30 13:57:29',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(171,'documento','application/pdf','Documento_Web','Poda de Formación y Brotes en Calabacín','Este estudio de la Universidad de Zaragoza, aunque enfocado en la evaluación agronómica de variedades de calabacín, incluye una sección relevante sobre la poda. Destaca que, si bien la poda de formación no es una práctica común, se considera interesante la poda a dos brazos, que implica cortar el tallo principal por encima de las dos primeras hojas verdaderas para fomentar el crecimiento de dos brazos secundarios y potencialmente aumentar la producción. También aborda la poda de brotes laterales que pueden surgir en variedades híbridas debido a un exceso de nitrógeno, y el deshojado de la parte inferior de la planta.','La poda de formación en calabacín no es habitual, pero se sugiere la poda a dos brazos cortando el tallo principal tras las dos primeras hojas verdaderas para estimular dos brazos secundarios.\nEsta técnica de poda a dos brazos podría influir en una mayor producción de frutos.\nLas variedades híbridas de calabacín pueden desarrollar brotes secundarios con un exceso de abonado nitrogenado, los cuales deben ser eliminados.\nEl deshojado se realiza en las hojas inferiores, envejecidas o dañadas, para mejorar la aireación y la penetración de la luz.\nLos cortes de deshojado deben ser limpios y realizados en la unión del peciolo con el tallo, siempre por debajo de los frutos más bajos.\nSe recomienda realizar el deshojado por la mañana y en condiciones de ambiente seco para minimizar el riesgo de enfermedades.',NULL,'/api/media?path=uploads%2Fespecies_pdfs_covers%2Fcover_10_171_1777557474636.jpg','https://web.archive.org/web/2/https://zaguan.unizar.es/record/76356/files/TAZ-TFG-2018-4730.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-04-30 13:57:33','2026-05-01 12:46:42','2026-05-01 12:46:42',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(172,'documento','application/pdf','Documento_Web','Cultivo de Calabacín en Invernadero: Riego y Fertilización','Este documento de la Universidad de Almería detalla el cultivo de calabacín bajo invernadero, con un enfoque particular en el manejo del riego y la fertilización. Se describen las necesidades hídricas y nutricionales de la planta, así como las pautas para la aplicación de fertilizantes en diferentes etapas del cultivo, tanto en riego a manta como en fertirrigación hidropónica. Se enfatiza la importancia de ajustar el pH de la solución de riego y se proporcionan unidades fertilizantes recomendadas por hectárea para lograr producciones óptimas.','Para una producción media de 70.000-80.000 kg/ha comercializable en riego a manta y terreno enarenado, se recomiendan 300-400 kg de Nitrógeno (N), 150-200 kg de Fósforo (P2O5) y 350-500 kg de Potasio (K2O) por hectárea.\nEl primer riego se realiza antes de la siembra, incorporando abonado de fondo con sulfato amónico (350-475 kg/ha), superfosfato de cal (600-900 kg/ha) y sulfato de potasa (250-350 kg/ha).\nEl segundo riego se aplica aproximadamente a los 15-25 días de la nascencia, con 250 kg/ha de Sulfato amónico 21%, 300 kg/ha de Superfosfato de cal 18% y 150 kg/ha de Sulfato de potasa.\nEn fertirrigación hidropónica, se aconsejan 200-300 U.F. de N, 150-200 U.F. de P2O5, 350-500 U.F. de K2O y 50 U.F. de MgO por hectárea.\nEs crucial ajustar el pH de la solución de riego utilizando ácido fosfórico o nítrico según proceda.',NULL,'/api/media?path=uploads%2Fespecies_pdfs_covers%2Fcover_10_172_1777557832101.jpg','https://web.archive.org/web/2/https://cooperativas-agro.s3.eu-west-1.amazonaws.com/old/docs/02428.pdf',0,NULL,NULL,NULL,NULL,0,2,NULL,0,'2026-04-30 14:03:31','2026-05-01 12:46:44','2026-05-01 12:46:44',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(173,'imagen_blog','image/webp','calabacin-en-huerto-cosecha-fresca-y-saludable-1777560311466.webp','Calabacín en Huerto: Cosecha Fresca y Saludable','{"seo_alt":"Imagen de un calabacín sano y listo para cosechar en un huerto moderno, con un agricultor feliz de fondo.","seo_title":"Calabacín en Huerto: Cosecha Fresca y Saludable","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":true}',NULL,NULL,NULL,'uploads/blog/calabacin-en-huerto-cosecha-fresca-y-saludable-1777560311466.webp',90564,NULL,NULL,NULL,NULL,1,1,NULL,1,'2026-04-30 14:45:12',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(174,'imagen_blog','image/webp','preparacion-del-suelo-para-cultivo-de-calabacin-1777560317898.webp','Preparación del Suelo para Cultivo de Calabacín','{"seo_alt":"Fotografía detallada de la siembra de calabacín en suelo fértil y bien preparado, clave para un buen inicio del cultivo.","seo_title":"Preparación del Suelo para Cultivo de Calabacín","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":false}',NULL,NULL,NULL,'uploads/blog/preparacion-del-suelo-para-cultivo-de-calabacin-1777560317898.webp',80386,NULL,NULL,NULL,NULL,0,2,NULL,1,'2026-04-30 14:45:18',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(175,'imagen_blog','image/webp','riego-y-acolchado-eficiente-en-cultivo-de-calabacin-1777560324201.webp','Riego y Acolchado Eficiente en Cultivo de Calabacín','{"seo_alt":"Planta de calabacín con sistema de riego por goteo y acolchado, mostrando un cuidado óptimo para una cosecha abundante.","seo_title":"Riego y Acolchado Eficiente en Cultivo de Calabacín","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":false}',NULL,NULL,NULL,'uploads/blog/riego-y-acolchado-eficiente-en-cultivo-de-calabacin-1777560324201.webp',110664,NULL,NULL,NULL,NULL,0,3,NULL,1,'2026-04-30 14:45:25',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(176,'imagen_blog','image/webp','calabacin-en-el-huerto-planta-sana-y-frutos-verdes-1777561255834.webp','Calabacín en el huerto: Planta sana y frutos verdes','{"seo_alt":"Imagen de una planta de calabacín vigorosa con frutos verdes, cultivada en un huerto moderno y soleado.","seo_title":"Calabacín en el huerto: Planta sana y frutos verdes","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":true}',NULL,NULL,NULL,'uploads/blog/calabacin-en-el-huerto-planta-sana-y-frutos-verdes-1777561255834.webp',44526,NULL,NULL,NULL,NULL,1,1,NULL,1,'2026-04-30 15:00:56',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(177,'imagen_blog','image/webp','preparacion-del-suelo-abono-organico-para-calabacin-1777561261299.webp','Preparación del suelo: Abono orgánico para calabacín','{"seo_alt":"Detalle de una mano añadiendo abono orgánico a un suelo fértil, preparando el terreno para el cultivo de calabacín.","seo_title":"Preparación del suelo: Abono orgánico para calabacín","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":false}',NULL,NULL,NULL,'uploads/blog/preparacion-del-suelo-abono-organico-para-calabacin-1777561261299.webp',88316,NULL,NULL,NULL,NULL,0,2,NULL,1,'2026-04-30 15:01:02',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(178,'imagen_blog','image/webp','cosecha-de-calabacines-frutos-frescos-y-listos-1777561267060.webp','Cosecha de calabacines: Frutos frescos y listos','{"seo_alt":"Calabacines recién cosechados con rocío matutino, presentados en una caja de madera rústica en el huerto.","seo_title":"Cosecha de calabacines: Frutos frescos y listos","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":false}',NULL,NULL,NULL,'uploads/blog/cosecha-de-calabacines-frutos-frescos-y-listos-1777561267060.webp',162614,NULL,NULL,NULL,NULL,0,3,NULL,1,'2026-04-30 15:01:07',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(179,'documento','application/pdf','Documento_Web','Evaluación Agronómica y Poda de Calabacín','Este documento técnico de la Universidad de Zaragoza aborda la evaluación agronómica de variedades de calabacín, incluyendo aspectos cruciales de la poda. Se detalla la eliminación de brotes secundarios para evitar frutos no comerciales y la poda de hojas envejecidas o excesivamente desarrolladas que dificulten la luminosidad y aireación. Se enfatiza la importancia de realizar cortes limpios en la unión del peciolo con el tallo, preferentemente por la mañana y con ambiente seco, para minimizar riesgos de enfermedades.','Las variedades híbridas de calabacín suelen emitir una sola guía, pero un exceso de abono nitrogenado puede inducir brotes secundarios que deben eliminarse.\nLa poda de brotes secundarios es crucial para mantener la calidad y comercialidad de los frutos, ya que los brotes laterales pueden producir frutos de menor valor.\nEl corte de hojas se justifica en casos de envejecimiento avanzado o desarrollo excesivo que comprometa la luminosidad y aireación interna de la planta, lo que puede disminuir la producción.\nEl deshojado debe realizarse por la mañana, con ambiente seco, efectuando cortes limpios en la unión del peciolo con el tallo, siempre por debajo de los frutos más bajos.\nEs fundamental no podar las hojas superiores que protegen los frutos del sol, y tras la poda, se recomienda aplicar tratamientos fungicidas para prevenir infecciones.',NULL,'https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/especies_pdfs_covers/cover_10_179_1777639663690.jpg','https://web.archive.org/web/2/https://zaguan.unizar.es/record/76356/files/TAZ-TFG-2018-4730.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-05-01 12:47:26','2026-05-01 12:51:35','2026-05-01 12:51:35',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(180,'documento','application/pdf','HC_49232588F (1).pdf','Informe Aptitud Conducción','Este documento es un informe de reconocimiento médico y psicofísico completo para evaluar la aptitud de un individuo, detallando su historial de salud, exploraciones físicas, oftalmológicas y psicológicas, y un dictamen final.','El documento proporcionado es un informe de reconocimiento médico y psicofísico exhaustivo, no un análisis sobre una especie agrícola. Como experto agrónomo, debo señalar que el contenido es ajeno a mi campo de especialización. El informe evalúa la aptitud de un individuo, probablemente para la conducción, y se estructura en las siguientes secciones clave:\n\n*   **Anamnesis General y Datos Personales (AMG, DP, AS):** Recoge el historial médico del interesado, incluyendo preguntas sobre enfermedades, mareos, problemas cardíacos, respiratorios, y uso de alcohol o estupefacientes. Se registran datos personales como edad (18 años), sexo (V), nacionalidad (ESPAÑA), y detalles de conducción (Num de Expediente 176/2026, Tipo Permiso B). El individuo declara no padecer enfermedades ni tomar medicación habitual.\n*   **Exploración Médica General (EMG, Inspección General):** Incluye audiometría (valores de 10-20 dB en OD y OI), talla (178 cm) y peso (77 kg). La tensión arterial es 123/67 mmHg con ritmo regular. El dictamen parcial general es \'APTO\'.\n*   **Anamnesis y Exploración Oftalmológica (AO, EO):** Evalúa la salud ocular y la agudeza visual. La agudeza visual con corrección es OD 1.4 y OI 1.5. El dictamen parcial oftalmológico es \'APTO\' con la restricción de usar gafas o lentes de contacto (código 0106) para asegurar una agudeza visual binocular de al menos 0,5.\n*   **Anamnesis y Aptitud Psicológica (AP, EP, Aptitud Perceptivo-Motora, Trastornos Mentales):** Se evalúa el estado psicológico, la aptitud perceptivo-motora (atención, coordinación bimanual, tiempo de reacción) y la presencia de trastornos mentales. El informe indica que el individuo no presenta alteraciones en el área afectiva ni toma medicación psiquiátrica. El dictamen parcial psicológico es \'APTO\'.\n*   **Dictamen Final (DF):** Concluye que el individuo es \'APTO\' para la actividad evaluada, con la única restricción de \'Gafas o lentes de contacto\' (0106).\n\nEn resumen, este documento es una evaluación de salud para determinar la idoneidad de una persona, y no contiene ninguna información relevante para un análisis agronómico sobre especies agrícolas, plagas, cultivos o técnicas agrícolas.',NULL,'https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/especies_pdfs_covers/cover_10_180_1777639943575.jpg','uploads/especies_pdfs/especie_10_1777639903719.pdf',1756745,NULL,NULL,NULL,NULL,0,1,NULL,0,'2026-05-01 12:52:03','2026-05-01 12:54:21','2026-05-01 12:54:21',NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(181,'documento','application/pdf','Documento_Web','Cultivo del Calabacín: Poda y Manejo','El documento del Ministerio de Agricultura, Pesca y Alimentación aborda el cultivo del calabacín, destacando que en condiciones normales de abonado y riego, la planta no requiere podas excesivas, desarrollando una única guía principal. Sin embargo, en situaciones de follaje abundante o ahijamiento, se recomienda la eliminación de tallos secundarios para evitar que los frutos de estos no alcancen tamaño comercial. Se enfatiza la importancia de podar estos brotes en su fase inicial, siempre respetando el tallo principal para mantener la productividad y calidad de la cosecha.','La poda en calabacín se reduce principalmente a la eliminación de tallos secundarios cuando la planta ahíja excesivamente debido a un abonado y riego intensivos.\nLos frutos que se desarrollan en los ramos secundarios suelen ser de tamaño no comercial, por lo que su eliminación temprana es crucial para concentrar la energía de la planta en la guía principal.\nEn cultivos normales, sin abusar de fertilizantes y agua, el calabacín tiende a desarrollar una sola guía, minimizando la necesidad de podas de formación.\nEl entutorado es una práctica complementaria a la poda, especialmente en invernadero, donde se ata el tallo principal a una cuerda para guiar su crecimiento vertical y optimizar el espacio y la luminosidad.\nLas temperaturas críticas para el calabacín incluyen la detención del crecimiento a 8°C y la helada a -1°C, mientras que la germinación óptima se da entre 20°C y 30°C, y el desarrollo óptimo a 25°C.',NULL,'https://storage.googleapis.com/verdantia-494121.firebasestorage.app/uploads/especies_pdfs_covers/cover_10_181_1777640404975.jpg','https://web.archive.org/web/2/https://www.mapa.gob.es/ministerio/pags/biblioteca/hojas/hd_1973_07.pdf',0,NULL,NULL,NULL,NULL,0,1,NULL,1,'2026-05-01 12:54:58','2026-05-01 13:00:07',NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(182,'imagen_blog','image/webp','planta-de-calabacin-saludable-en-huerto-1777640482901.webp','Planta de calabacín saludable en huerto','{"seo_alt":"Imagen de una planta de calabacín vigorosa con frutos, ideal para inspirar a agricultores principiantes en su huerto.","seo_title":"Planta de calabacín saludable en huerto","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":true}',NULL,NULL,NULL,'uploads/blog/planta-de-calabacin-saludable-en-huerto-1777640482901.webp',198594,NULL,NULL,NULL,NULL,1,1,NULL,1,'2026-05-01 13:01:25',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(183,'imagen_blog','image/webp','preparacion-del-suelo-para-sembrar-calabacin-1777640490194.webp','Preparación del suelo para sembrar calabacín','{"seo_alt":"Manos de agricultor preparando la tierra fértil con abono orgánico para la siembra de calabacín, mostrando los primeros pasos del cultivo.","seo_title":"Preparación del suelo para sembrar calabacín","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":false}',NULL,NULL,NULL,'uploads/blog/preparacion-del-suelo-para-sembrar-calabacin-1777640490194.webp',121922,NULL,NULL,NULL,NULL,0,2,NULL,1,'2026-05-01 13:01:32',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(184,'imagen_blog','image/webp','cosecha-de-calabacin-fresco-a-mano-1777640496233.webp','Cosecha de calabacín fresco a mano','{"seo_alt":"Manos de agricultor recolectando un calabacín de tamaño óptimo en el huerto, destacando la frescura y la recompensa del cultivo.","seo_title":"Cosecha de calabacín fresco a mano","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":false}',NULL,NULL,NULL,'uploads/blog/cosecha-de-calabacin-fresco-a-mano-1777640496233.webp',79442,NULL,NULL,NULL,NULL,0,3,NULL,1,'2026-05-01 13:01:38',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(185,'imagen_blog','image/webp','calabacin-fresco-en-el-huerto-1777640996054.webp','Calabacín fresco en el huerto','{"seo_alt":"Imagen de calabacines creciendo sanos en un huerto moderno, lista para ser cosechada por un agricultor.","seo_title":"Calabacín fresco en el huerto","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":true}',NULL,NULL,NULL,'uploads/blog/calabacin-fresco-en-el-huerto-1777640996054.webp',95020,NULL,NULL,NULL,NULL,1,1,NULL,1,'2026-05-01 13:09:58',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(186,'imagen_blog','image/webp','preparacion-del-suelo-para-calabacin-1777641002659.webp','Preparación del suelo para calabacín','{"seo_alt":"Suelo bien preparado con caballones listos para la siembra de calabacín, mostrando la importancia de la materia orgánica.","seo_title":"Preparación del suelo para calabacín","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":false}',NULL,NULL,NULL,'uploads/blog/preparacion-del-suelo-para-calabacin-1777641002659.webp',110818,NULL,NULL,NULL,NULL,0,2,NULL,1,'2026-05-01 13:10:04',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(187,'imagen_blog','image/webp','calabacin-entutorado-y-productivo-1777641009707.webp','Calabacín entutorado y productivo','{"seo_alt":"Planta de calabacín sana y entutorada, mostrando frutos en desarrollo y la técnica de guiado para un cultivo óptimo.","seo_title":"Calabacín entutorado y productivo","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":false}',NULL,NULL,NULL,'uploads/blog/calabacin-entutorado-y-productivo-1777641009707.webp',98638,NULL,NULL,NULL,NULL,0,3,NULL,1,'2026-05-01 13:10:13',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(188,'imagen_blog','image/webp','cultivo-de-calabacin-amanecer-en-el-huerto-1777641676126.webp','Cultivo de Calabacín: Amanecer en el Huerto','{"seo_alt":"Imagen de un campo de calabacines bajo la luz del amanecer, con un agricultor inspeccionando la cosecha. Ideal para principiantes.","seo_title":"Cultivo de Calabacín: Amanecer en el Huerto","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":true}',NULL,NULL,NULL,'uploads/blog/cultivo-de-calabacin-amanecer-en-el-huerto-1777641676126.webp',92148,NULL,NULL,NULL,NULL,1,1,NULL,1,'2026-05-01 13:21:18',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(189,'imagen_blog','image/webp','calabacin-raices-en-suelo-fertil-1777641682619.webp','Calabacín: Raíces en Suelo Fértil','{"seo_alt":"Detalle de una planta de calabacín con raíces robustas en un suelo rico y bien preparado, simbolizando un buen inicio de cultivo.","seo_title":"Calabacín: Raíces en Suelo Fértil","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":false}',NULL,NULL,NULL,'uploads/blog/calabacin-raices-en-suelo-fertil-1777641682619.webp',112572,NULL,NULL,NULL,NULL,0,2,NULL,1,'2026-05-01 13:21:25',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(190,'imagen_blog','image/webp','entutorado-del-calabacin-soporte-para-el-crecimiento-1777641691005.webp','Entutorado del Calabacín: Soporte para el Crecimiento','{"seo_alt":"Manos atando una planta joven de calabacín a un tutor de madera, ilustrando el cuidado y soporte necesarios para su desarrollo.","seo_title":"Entutorado del Calabacín: Soporte para el Crecimiento","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":false}',NULL,NULL,NULL,'uploads/blog/entutorado-del-calabacin-soporte-para-el-crecimiento-1777641691005.webp',90404,NULL,NULL,NULL,NULL,0,3,NULL,1,'2026-05-01 13:21:33',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(191,'imagen_blog','image/webp','calabacin-saludable-en-huerto-soleado-1777748353456.webp','Calabacín saludable en huerto soleado','{"seo_alt":"Imagen de una planta de calabacín vigorosa con frutos verdes listos para cosechar en un huerto al aire libre.","seo_title":"Calabacín saludable en huerto soleado","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":true}',NULL,NULL,NULL,'uploads/blog/calabacin-saludable-en-huerto-soleado-1777748353456.webp',109108,NULL,NULL,NULL,NULL,1,1,NULL,1,'2026-05-02 18:59:16',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(192,'imagen_blog','image/webp','semillero-de-calabacin-en-tierra-fertil-1777748361806.webp','Semillero de calabacín en tierra fértil','{"seo_alt":"Primer plano de una joven planta de calabacín brotando en suelo orgánico y bien preparado, bajo luz natural.","seo_title":"Semillero de calabacín en tierra fértil","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":false}',NULL,NULL,NULL,'uploads/blog/semillero-de-calabacin-en-tierra-fertil-1777748361806.webp',80154,NULL,NULL,NULL,NULL,0,2,NULL,1,'2026-05-02 18:59:24',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(193,'imagen_blog','image/webp','siembra-manual-de-semillas-de-calabacin-1777748367089.webp','Siembra manual de semillas de calabacín','{"seo_alt":"Manos de jardinero sembrando semillas de calabacín en un bancal preparado, mostrando cuidado y técnica.","seo_title":"Siembra manual de semillas de calabacín","profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_style":"","es_portada_blog":false}',NULL,NULL,NULL,'uploads/blog/siembra-manual-de-semillas-de-calabacin-1777748367089.webp',102902,NULL,NULL,NULL,NULL,0,3,NULL,1,'2026-05-02 18:59:30',NULL,NULL,NULL,10,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `datosadjuntos` VALUES(194,'documento','application/pdf','Documento_Web','Poda apical en calabaza para frutos y semillas','Este estudio evalúa el efecto de la poda apical en la producción de frutos y semillas de calabaza (Cucurbita moschata). La poda busca equilibrar el desarrollo vegetativo, la floración y la fructificación, desviando auxinas hacia las yemas laterales para estimular su crecimiento. Se investigó la influencia de la poda en el sexto, octavo y décimo nudo de la rama principal, concluyendo que no hubo un impacto significativo en la productividad total de frutos y semillas, aunque sí en el número de ramas secundarias.','La poda apical, también conocida como desponte o capación, se realiza en la haste principal de cucurbitáceas para equilibrar el desarrollo de la planta.\nAltas concentraciones de auxina en el meristema apical se desvían a las gemas laterales tras la poda, promoviendo el crecimiento de ramas secundarias.\nEl estudio no encontró diferencias significativas en la producción de frutos y semillas de calabaza con la poda apical, aunque sí en el número de ramas secundarias.\nSe obtuvieron altas medias de germinación (94%) y productividad de frutos (16.9 t ha-1) y semillas (148 kg ha-1) en plantas no podadas.\nLa poda apical busca estimular la emisión de brotes laterales, lo que podría aumentar el número de flores femeninas y la fijación de frutos por planta.',NULL,NULL,'https://web.archive.org/web/2/https://www.cabidigitallibrary.org/doi/pdf/10.5555/20143325852',0,NULL,NULL,NULL,NULL,0,1,NULL,1,'2026-05-02 19:36:01',NULL,NULL,NULL,21,NULL,NULL,NULL,NULL,NULL);

DROP TABLE IF EXISTS `datosatmosfericos`;
CREATE TABLE `datosatmosfericos` (
  `iddatosatmosfericos` int NOT NULL AUTO_INCREMENT,
  `xdatosatmosfericosidusuarios` int NOT NULL,
  `datosatmosfericosfecha` date NOT NULL,
  `datosatmosfericostempmax` decimal(4,1) DEFAULT NULL,
  `datosatmosfericostempmin` decimal(4,1) DEFAULT NULL,
  `datosatmosfericoslluvia` decimal(5,1) DEFAULT NULL,
  `datosatmosfericostempactual` decimal(4,1) DEFAULT NULL,
  `datosatmosfericospoblacion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`iddatosatmosfericos`),
  UNIQUE KEY `idx_usuario_fecha` (`xdatosatmosfericosidusuarios`,`datosatmosfericosfecha`),
  CONSTRAINT `fk_datosatmosfericos_usuarios` FOREIGN KEY (`xdatosatmosfericosidusuarios`) REFERENCES `usuarios` (`idusuarios`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1578 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `datosatmosfericos` VALUES(1,1,'2026-04-18','21.0','12.0','0.0','18.0','Benissa');
INSERT INTO `datosatmosfericos` VALUES(3,5,'2026-04-01','20.2','10.5','0.0',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(4,5,'2026-04-02','19.1','12.2','0.0',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(5,5,'2026-04-03','18.6','10.4','0.0',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(6,5,'2026-04-04','21.4','8.8','0.0',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(7,5,'2026-04-05','21.5','11.6','0.0',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(8,5,'2026-04-06','19.1','10.1','0.0',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(9,5,'2026-04-07','18.4','11.3','0.0',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(10,5,'2026-04-08','18.6','12.5','0.0',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(11,5,'2026-04-09','21.7','12.7','0.0',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(12,5,'2026-04-10','24.4','13.5','0.0',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(13,5,'2026-04-11','19.8','15.0','0.0',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(14,5,'2026-04-12','18.1','13.9','5.1',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(15,5,'2026-04-13','16.2','11.4','7.9',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(16,5,'2026-04-14','20.2','10.4','0.0',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(17,5,'2026-04-15','21.7','10.4','0.0',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(18,5,'2026-04-16','21.9','13.1','0.0',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(19,5,'2026-04-17','24.0','12.9','0.0',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(20,5,'2026-04-18','24.7','12.6','0.0',NULL,'D+');
INSERT INTO `datosatmosfericos` VALUES(21,6,'2026-04-01','18.0','12.0','0.0',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(22,6,'2026-04-02','18.0','14.2','0.0',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(23,6,'2026-04-03','17.8','13.5','0.0',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(24,6,'2026-04-04','17.9','12.5','0.0',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(25,6,'2026-04-05','18.6','14.1','0.0',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(26,6,'2026-04-06','17.9','12.8','0.0',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(27,6,'2026-04-07','17.8','14.1','0.0',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(28,6,'2026-04-08','18.8','15.1','0.0',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(29,6,'2026-04-09','20.9','15.4','0.0',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(30,6,'2026-04-10','22.5','16.3','0.0',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(31,6,'2026-04-11','20.0','17.6','0.0',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(32,6,'2026-04-12','18.5','14.3','3.4',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(33,6,'2026-04-13','15.9','11.8','6.7',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(34,6,'2026-04-14','19.4','13.8','0.0',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(35,6,'2026-04-15','18.9','12.8','0.0',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(36,6,'2026-04-16','19.8','14.3','0.0',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(37,6,'2026-04-17','20.1','15.0','0.0',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(38,6,'2026-04-18','20.8','14.0','0.0',NULL,'J+');
INSERT INTO `datosatmosfericos` VALUES(39,7,'2026-04-01','19.3','10.0','0.0',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(40,7,'2026-04-02','18.5','12.5','0.0',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(41,7,'2026-04-03','19.3','11.0','0.0',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(42,7,'2026-04-04','19.1','10.3','0.0',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(43,7,'2026-04-05','19.8','12.0','0.0',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(44,7,'2026-04-06','20.6','11.2','0.0',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(45,7,'2026-04-07','20.1','13.6','0.0',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(46,7,'2026-04-08','21.6','14.9','0.0',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(47,7,'2026-04-09','24.3','15.6','0.0',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(48,7,'2026-04-10','25.7','15.7','0.0',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(49,7,'2026-04-11','22.1','17.7','0.0',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(50,7,'2026-04-12','18.5','13.6','3.7',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(51,7,'2026-04-13','16.4','11.3','7.4',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(52,7,'2026-04-14','20.2','11.4','0.0',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(53,7,'2026-04-15','19.7','11.1','0.0',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(54,7,'2026-04-16','20.9','13.4','0.0',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(55,7,'2026-04-17','21.8','13.6','0.0',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(56,7,'2026-04-18','22.6','12.8','0.0',NULL,'Calpe');
INSERT INTO `datosatmosfericos` VALUES(57,8,'2026-04-01','18.7','8.7','0.0',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(58,8,'2026-04-02','18.4','11.7','0.0',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(59,8,'2026-04-03','18.2','9.8','0.0',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(60,8,'2026-04-04','19.2','7.9','0.0',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(61,8,'2026-04-05','19.7','10.4','0.0',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(62,8,'2026-04-06','18.9','9.2','0.0',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(63,8,'2026-04-07','18.3','11.3','0.0',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(64,8,'2026-04-08','19.6','12.8','0.0',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(65,8,'2026-04-09','22.3','13.1','0.0',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(66,8,'2026-04-10','24.5','13.3','0.0',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(67,8,'2026-04-11','20.0','15.0','0.0',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(68,8,'2026-04-12','17.3','12.8','4.3',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(69,8,'2026-04-13','15.3','10.1','7.8',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(70,8,'2026-04-14','19.6','10.0','0.0',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(71,8,'2026-04-15','19.8','9.7','0.0',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(72,8,'2026-04-16','21.2','11.9','0.0',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(73,8,'2026-04-17','21.9','12.1','0.0',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(74,8,'2026-04-18','22.5','11.0','0.0',NULL,'Teulada');
INSERT INTO `datosatmosfericos` VALUES(75,9,'2026-04-01','18.0','8.7','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(76,9,'2026-04-02','17.2','11.2','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(77,9,'2026-04-03','18.0','9.7','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(78,9,'2026-04-04','17.8','9.0','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(79,9,'2026-04-05','18.5','10.7','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(80,9,'2026-04-06','19.3','9.9','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(81,9,'2026-04-07','18.8','12.3','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(82,9,'2026-04-08','20.3','13.6','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(83,9,'2026-04-09','23.0','14.3','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(84,9,'2026-04-10','24.4','14.4','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(85,9,'2026-04-11','20.8','16.4','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(86,9,'2026-04-12','17.2','12.3','3.7',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(87,9,'2026-04-13','15.1','10.0','7.4',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(88,9,'2026-04-14','18.9','10.1','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(89,9,'2026-04-15','18.4','9.8','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(90,9,'2026-04-16','19.6','12.1','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(91,9,'2026-04-17','20.5','12.3','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(92,9,'2026-04-18','21.3','11.5','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(93,10,'2026-04-01','20.8','9.9','0.0',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(94,10,'2026-04-02','19.2','12.2','0.0',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(95,10,'2026-04-03','19.1','10.3','0.0',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(96,10,'2026-04-04','22.7','9.5','0.0',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(97,10,'2026-04-05','25.2','11.9','0.0',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(98,10,'2026-04-06','19.0','9.7','0.0',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(99,10,'2026-04-07','18.6','9.7','0.0',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(100,10,'2026-04-08','19.5','11.1','0.0',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(101,10,'2026-04-09','22.4','11.8','0.0',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(102,10,'2026-04-10','24.1','13.2','0.0',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(103,10,'2026-04-11','20.9','14.4','0.1',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(104,10,'2026-04-12','17.1','13.1','7.7',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(105,10,'2026-04-13','17.0','10.5','13.9',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(106,10,'2026-04-14','20.5','11.3','0.0',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(107,10,'2026-04-15','24.2','11.6','0.0',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(108,10,'2026-04-16','25.0','12.6','0.0',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(109,10,'2026-04-17','24.1','13.6','0.0',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(110,10,'2026-04-18','27.2','13.3','0.0',NULL,'Pego');
INSERT INTO `datosatmosfericos` VALUES(111,11,'2026-04-01','20.3','9.3','0.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(112,11,'2026-04-02','19.4','12.1','0.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(113,11,'2026-04-03','18.9','8.9','0.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(114,11,'2026-04-04','22.6','7.5','0.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(115,11,'2026-04-05','22.7','10.1','0.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(116,11,'2026-04-06','19.1','9.1','0.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(117,11,'2026-04-07','18.1','10.0','0.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(118,11,'2026-04-08','18.6','11.5','0.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(119,11,'2026-04-09','21.9','11.8','0.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(120,11,'2026-04-10','25.8','12.7','0.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(121,11,'2026-04-11','19.8','14.4','0.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(122,11,'2026-04-12','17.6','13.2','6.4',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(123,11,'2026-04-13','16.2','10.7','9.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(124,11,'2026-04-14','20.5','9.9','0.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(125,11,'2026-04-15','22.6','9.3','0.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(126,11,'2026-04-16','23.1','12.1','0.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(127,11,'2026-04-17','24.9','11.7','0.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(128,11,'2026-04-18','26.3','11.1','0.0',NULL,'Pedreguer');
INSERT INTO `datosatmosfericos` VALUES(129,12,'2026-04-01','20.6','10.1','0.0',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(130,12,'2026-04-02','19.3','12.3','0.0',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(131,12,'2026-04-03','19.2','10.0','0.0',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(132,12,'2026-04-04','22.9','9.1','0.0',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(133,12,'2026-04-05','23.4','11.2','0.0',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(134,12,'2026-04-06','19.3','10.3','0.0',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(135,12,'2026-04-07','18.6','10.3','0.0',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(136,12,'2026-04-08','19.3','12.0','0.0',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(137,12,'2026-04-09','22.5','12.1','0.0',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(138,12,'2026-04-10','26.3','13.6','0.0',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(139,12,'2026-04-11','20.8','15.4','0.0',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(140,12,'2026-04-12','18.2','13.3','7.4',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(141,12,'2026-04-13','16.6','11.1','10.1',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(142,12,'2026-04-14','20.8','11.4','0.0',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(143,12,'2026-04-15','23.1','10.9','0.0',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(144,12,'2026-04-16','23.3','13.2','0.0',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(145,12,'2026-04-17','25.6','13.3','0.0',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(146,12,'2026-04-18','26.4','12.4','0.0',NULL,'Ondara');
INSERT INTO `datosatmosfericos` VALUES(147,13,'2026-04-01','20.9','9.9','0.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(148,13,'2026-04-02','19.4','12.2','0.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(149,13,'2026-04-03','19.8','10.5','0.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(150,13,'2026-04-04','21.2','8.8','0.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(151,13,'2026-04-05','21.6','11.0','0.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(152,13,'2026-04-06','20.8','10.4','0.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(153,13,'2026-04-07','19.8','12.1','0.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(154,13,'2026-04-08','21.0','13.7','0.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(155,13,'2026-04-09','24.2','14.0','0.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(156,13,'2026-04-10','26.5','14.7','0.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(157,13,'2026-04-11','21.6','16.5','0.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(158,13,'2026-04-12','18.3','13.5','5.1',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(159,13,'2026-04-13','16.5','11.0','8.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(160,13,'2026-04-14','20.8','11.2','0.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(161,13,'2026-04-15','21.6','10.7','0.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(162,13,'2026-04-16','22.8','13.1','0.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(163,13,'2026-04-17','24.1','13.1','0.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(164,13,'2026-04-18','24.8','12.5','0.0',NULL,'Gata de Gorgos');
INSERT INTO `datosatmosfericos` VALUES(165,14,'2026-04-01','20.7','10.2','0.0',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(166,14,'2026-04-02','19.4','12.4','0.0',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(167,14,'2026-04-03','19.3','10.1','0.0',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(168,14,'2026-04-04','23.0','9.2','0.0',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(169,14,'2026-04-05','23.5','11.3','0.0',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(170,14,'2026-04-06','19.4','10.4','0.0',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(171,14,'2026-04-07','18.7','10.4','0.0',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(172,14,'2026-04-08','19.4','12.1','0.0',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(173,14,'2026-04-09','22.6','12.2','0.0',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(174,14,'2026-04-10','26.4','13.7','0.0',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(175,14,'2026-04-11','20.9','15.5','0.0',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(176,14,'2026-04-12','18.3','13.4','7.4',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(177,14,'2026-04-13','16.7','11.2','10.1',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(178,14,'2026-04-14','20.9','11.5','0.0',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(179,14,'2026-04-15','23.2','11.0','0.0',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(180,14,'2026-04-16','23.4','13.3','0.0',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(181,14,'2026-04-17','25.7','13.4','0.0',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(182,14,'2026-04-18','26.5','12.5','0.0',NULL,'El Verger');
INSERT INTO `datosatmosfericos` VALUES(183,1,'2026-04-01','18.0','8.7','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(184,1,'2026-04-02','17.2','11.2','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(185,1,'2026-04-03','18.0','9.7','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(186,1,'2026-04-04','17.8','9.0','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(187,1,'2026-04-05','18.5','10.7','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(188,1,'2026-04-06','19.3','9.9','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(189,1,'2026-04-07','18.8','12.3','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(190,1,'2026-04-08','20.3','13.6','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(191,1,'2026-04-09','23.0','14.3','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(192,1,'2026-04-10','24.4','14.4','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(193,1,'2026-04-11','20.8','16.4','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(194,1,'2026-04-12','17.2','12.3','3.7',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(195,1,'2026-04-13','15.1','10.0','7.4',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(196,1,'2026-04-14','18.9','10.1','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(197,1,'2026-04-15','18.4','9.8','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(198,1,'2026-04-16','19.6','12.1','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(199,1,'2026-04-17','20.5','12.3','0.0',NULL,'Benissa');
INSERT INTO `datosatmosfericos` VALUES(395,1,'2026-04-19','21.0','13.0','0.0','19.0','Benissa');
INSERT INTO `datosatmosfericos` VALUES(913,1,'2026-04-20','21.0','13.0','0.0','20.0','Benissa');
INSERT INTO `datosatmosfericos` VALUES(1075,2,'2026-04-20','21.0','13.0','0.0','21.0','Benissa');
INSERT INTO `datosatmosfericos` VALUES(1210,1,'2026-04-22','21.0','13.0','0.0','19.0','Benissa');
INSERT INTO `datosatmosfericos` VALUES(1212,2,'2026-04-22','22.0','13.0','0.0','21.0','Benissa');

DROP TABLE IF EXISTS `especies`;
CREATE TABLE `especies` (
  `idespecies` int NOT NULL AUTO_INCREMENT,
  `especiesnombre` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `especiesnombrecientifico` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiesfamilia` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiestipo` set('hortaliza','fruta','aromatica','leguminosa','cereal') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiesciclo` set('anual','bianual','perenne') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiesdiasgerminacion` int DEFAULT NULL,
  `especiesdiashastatrasplante` int DEFAULT NULL,
  `especiesviabilidadsemilla` decimal(8,2) DEFAULT NULL,
  `especiesdiashastafructificacion` int DEFAULT NULL,
  `especiestemperaturaminima` decimal(8,2) DEFAULT NULL,
  `especiestemperaturaoptima` decimal(8,2) DEFAULT NULL,
  `especiesmarcoplantas` decimal(8,2) DEFAULT NULL,
  `especiesmarcofilas` decimal(8,2) DEFAULT NULL,
  `especiesprofundidadsiembra` decimal(8,2) DEFAULT NULL,
  `especieshistoria` text COLLATE utf8mb4_general_ci,
  `especiesdescripcion` text COLLATE utf8mb4_general_ci,
  `especiescolor` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiestamano` enum('pequeno','mediano','grande') COLLATE utf8mb4_general_ci DEFAULT 'mediano',
  `especiesfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `especiesfechasemillerodesde` int DEFAULT NULL,
  `especiesfechasemillerohasta` int DEFAULT NULL,
  `especiesfechasiembradirectadesde` int DEFAULT NULL,
  `especiesfechasiembradirectahasta` int DEFAULT NULL,
  `especiestrasplantedesde` int DEFAULT NULL,
  `especiestrasplantehasta` int DEFAULT NULL,
  `especiesfecharecolecciondesde` int DEFAULT NULL,
  `especiesfecharecoleccionhasta` int DEFAULT NULL,
  `xespeciesidusuarios` int DEFAULT NULL,
  `especiesvisibilidadsino` tinyint(1) DEFAULT '1',
  `especiesfuentesinformacion` text COLLATE utf8mb4_general_ci,
  `especiesautosuficiencia` decimal(8,2) DEFAULT NULL,
  `especiesautosuficienciaconserva` decimal(8,2) DEFAULT NULL,
  `especiesicono` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiesbiodinamicacategoria` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiesbiodinamicanotas` text COLLATE utf8mb4_general_ci,
  `especiesprofundidadtrasplante` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiesphsuelo` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiesnecesidadriego` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiestiposiembra` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiesvolumenmaceta` int DEFAULT NULL,
  `especiesluzsolar` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiescaracteristicassuelo` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiesdificultad` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiestemperaturamaxima` int DEFAULT NULL,
  PRIMARY KEY (`idespecies`),
  UNIQUE KEY `nombre` (`especiesnombre`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `especies` VALUES(3,'Tomate','Solanum lycopersicum','Solanaceae','hortaliza,fruta','anual',7,30,'4.00',70,'10.00','25.00','50.00','80.00','0.50','El tomate (Solanum lycopersicum) tiene su origen en la región andina de América del Sur, específicamente en lo que hoy es Perú, Ecuador y el norte de Chile. Fue domesticado por primera vez en México, donde los aztecas lo cultivaban y lo llamaban "xitomatl". Los conquistadores españoles lo llevaron a Europa en el siglo XVI, inicialmente como una planta ornamental debido a la desconfianza sobre su comestibilidad, ya que pertenece a la familia de las solanáceas, que incluye muchas plantas venenosas.\n\nCon el tiempo, el tomate se fue integrando en la gastronomía europea, especialmente en Italia y España, donde se convirtió en un ingrediente fundamental de muchas de sus cocinas. Su popularidad se extendió por todo el mundo, y hoy es una de las hortalizas más cultivadas y consumidas globalmente, con miles de variedades adaptadas a diferentes climas y usos culinarios.','El tomate requiere pleno sol y suelos bien drenados y ricos en materia orgánica. Es sensible a las heladas, por lo que se siembra o trasplanta después del último riesgo de estas. Necesita riego regular y constante, especialmente durante la floración y fructificación, evitando mojar las hojas para prevenir enfermedades fúngicas. Es recomendable el entutorado para soportar el peso de los frutos y facilitar la aireación. La poda de chupones mejora la producción y el tamaño de los frutos.','Rojo','mediano','2026-04-02 11:22:39',2,4,4,5,4,6,7,10,NULL,1,'https://es.wikipedia.org/wiki/Solanum_lycopersicum, https://es.wikipedia.org/wiki/Agricultura_biodin%C3%A1mica','10.00','20.00','🍅','fruto','Para el tomate, que es una planta de fruto, se recomienda sembrar y trasplantar durante los días de fruto ascendente. La poda y el entutorado son más efectivos en días de hoja descendente para dirigir la energía a los frutos. La recolección se beneficia de los días de fruto ascendente para mejorar la conservación y el sabor.',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(4,'Pimiento','Capsicum annuum','Solanáceas','hortaliza,fruta','anual,perenne',12,NULL,'3.00',75,'12.00','25.00','40.00','60.00','1.00','Originario de Centroam+','Hortaliza de fruto que requiere altas temperaturas (m+',NULL,NULL,'2026-04-02 15:57:52',2,4,NULL,NULL,4,6,7,10,NULL,1,NULL,NULL,NULL,'🫑',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(5,'Berenjena','Solanum melongena','Solanaceae','hortaliza','anual',10,50,'5.00',85,'10.00','25.00','50.00','90.00','1.00','La berenjena, Solanum melongena, tiene sus orígenes en el sudeste asiático, específicamente en la India y China, donde ha sido cultivada desde la antigüedad. Se han encontrado registros de su cultivo en textos sánscritos que datan de hace más de 2000 años, siendo un alimento básico en estas regiones mucho antes de su llegada a Occidente.\nFue introducida en Europa por los árabes a través de la Península Ibérica en la Edad Media, alrededor del siglo VII u VIII. Inicialmente, su consumo fue limitado debido a la creencia de que era venenosa o causaba enfermedades, pero con el tiempo, y gracias a la mejora de las variedades y el conocimiento de su preparación, se popularizó, especialmente en la cuenca mediterránea, donde se convirtió en un ingrediente fundamental de muchas cocinas tradicionales.','La berenjena requiere pleno sol y suelos ricos, bien drenados y con buen contenido de materia orgánica. Es sensible a las heladas, por lo que se siembra en semillero y se trasplanta cuando el riesgo de heladas ha pasado. Necesita riego regular y constante, especialmente durante la floración y fructificación. Es recomendable entutorar las plantas para soportar el peso de los frutos y evitar que toquen el suelo. La recolección debe hacerse cuando los frutos tienen un tamaño adecuado y un color brillante, antes de que las semillas se endurezcan.','Morado','mediano','2026-04-02 15:57:52',2,4,NULL,NULL,4,6,7,10,NULL,1,'https://es.wikipedia.org/wiki/Solanum_melongena,https://es.wikipedia.org/wiki/Agricultura_biodin%C3%A1mica','4.00','7.00','🍆','fruto','Para la berenjena, que es una planta de fruto, se recomienda sembrar y trasplantar durante los días de fruto (cuando la luna pasa por constelaciones de fuego como Aries, Leo o Sagitario). La recolección también es óptima en días de fruto para potenciar su sabor y energía. Evitar manipular la planta en días de raíz o hoja.',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(6,'Cebolla','Allium cepa','Amarilidáceas','hortaliza','anual,bianual',10,NULL,'2.00',120,'5.00','20.00','10.00','25.00','1.00','Una de las hortalizas m+','Bulbo comestible de ciclo largo. Prefiere sustratos sueltos, con muy buen drenaje para evitar la pudrici+',NULL,NULL,'2026-04-02 15:57:52',12,3,NULL,NULL,3,5,6,8,NULL,1,NULL,NULL,NULL,'🧅',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(8,'Lechuga','Lactuca sativa','Compuestas','hortaliza','anual',7,NULL,'5.00',55,'5.00','18.00','25.00','30.00','1.00','Originaria de la cuenca mediterr+','Hortaliza de hoja muy vers+',NULL,NULL,'2026-04-02 15:57:52',2,10,NULL,NULL,3,10,3,12,NULL,1,NULL,NULL,NULL,'🥬',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(9,'Zanahoria','Daucus carota','Umbelíferas','hortaliza','bianual',15,NULL,'3.00',75,'5.00','18.00','5.00','25.00','1.00','Originaria de Afganist+','Ra+',NULL,'mediano','2026-04-02 15:57:52',NULL,NULL,2,11,NULL,NULL,5,12,NULL,0,NULL,NULL,NULL,'🥕',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(10,'Calabacín','Cucurbita pepo','Cucurbitaceae','hortaliza','anual',7,25,'5.00',55,'10.00','24.00','70.00','120.00','2.50','El calabacín, una variedad de Cucurbita pepo, tiene sus orígenes en América, donde fue domesticado hace miles de años. Inicialmente, las culturas precolombinas valoraban más sus semillas que su pulpa, que solía ser amarga. Con el tiempo, a través de la selección, se desarrollaron variedades con frutos más dulces y tiernos.\nFue introducido en Europa tras la llegada de Cristóbal Colón, pero no fue hasta el siglo XIX en Italia cuando se popularizó su consumo como verdura tierna, dando origen a la forma y el nombre que conocemos hoy. Desde entonces, se ha convertido en un cultivo fundamental en muchas gastronomías del mundo.','El calabacín requiere pleno sol y un suelo rico en materia orgánica y bien drenado. Es fundamental mantener una humedad constante, especialmente durante la floración y fructificación, para asegurar un buen desarrollo. Se recomienda cosechar los frutos cuando son jóvenes y tiernos para promover una producción continua y evitar que se vuelvan fibrosos.','Verde','mediano','2026-04-02 15:57:52',3,5,4,7,4,6,6,10,NULL,1,'https://es.wikipedia.org/wiki/Cucurbita_pepo,https://es.wikipedia.org/wiki/Agricultura_biodin%C3%A1mica','4.00','7.00','🟢','fruto','Para el calabacín, aprovecha los días de fruto del calendario lunar biodinámico para la siembra y el trasplante, favoreciendo un desarrollo vigoroso. La recolección en días de fruto también puede potenciar la calidad y conservación de los mismos.','5','6.5 - 7.0','alta','ambas',25,'pleno_sol','rico en materia orgánica, bien drenado, franco','baja',32);
INSERT INTO `especies` VALUES(11,'Pepino','Cucumis sativus','Cucurbitáceas','hortaliza,fruta','anual',8,NULL,'5.00',55,'12.00','25.00','40.00','100.00','2.00','Originario de la India, cultivado hace m+','Cultivo de porte rastrero/trepador famoso por su gran nivel de hidrataci+',NULL,NULL,'2026-04-02 15:57:52',3,5,4,6,4,5,6,9,NULL,1,NULL,NULL,NULL,'🥒',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(12,'Rábano','Raphanus sativus','Crucíferas','hortaliza','anual',5,NULL,'5.00',25,'5.00','18.00','5.00','20.00','1.00','Originario de China y Asia Central. Cultivado en Egipto y Grecia desde la antig++edad. Es una de las hortalizas de ciclo m+','Crecimiento mete+',NULL,NULL,'2026-04-02 15:57:52',0,0,1,12,NULL,NULL,2,12,NULL,1,NULL,NULL,NULL,'🌱',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(13,'Espinaca','Spinacia oleracea','Quenopodiáceas','hortaliza','anual,bianual',8,NULL,'4.00',40,'2.00','18.00','15.00','25.00','2.00','Originaria de Persia (actual Ir+','Hortaliza frondosa amigable con el clima fr+',NULL,NULL,'2026-04-02 15:57:52',0,0,8,2,NULL,NULL,10,4,NULL,1,NULL,NULL,NULL,'🍃',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(14,'Ajos','Allium sativum','Amaryllidaceae','hortaliza,aromatica','anual,perenne',10,NULL,'3.00',222,'9.00','24.00','14.00','32.00','5.00','Guardado admin ok','',NULL,'mediano','2026-04-02 17:50:03',1,1,1,1,1,1,1,1,NULL,1,'Fuente admin ok',NULL,NULL,'🧄',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(15,'Maíz',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mediano','2026-05-02 11:20:57',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(16,'Judía',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mediano','2026-05-02 11:20:57',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(17,'Capuchina',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mediano','2026-05-02 11:20:57',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(18,'Caléndula',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mediano','2026-05-02 11:20:57',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(19,'Patata',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mediano','2026-05-02 11:20:58',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(20,'Hinojo',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mediano','2026-05-02 11:20:58',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(21,'Calabaza',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mediano','2026-05-02 11:20:58',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(22,'Salvia',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mediano','2026-05-02 18:54:35',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(23,'Borraja',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mediano','2026-05-02 18:58:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especies` VALUES(24,'Frijol',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mediano','2026-05-02 19:37:21',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);

DROP TABLE IF EXISTS `especiesplagas`;
CREATE TABLE `especiesplagas` (
  `idespeciesplagas` int NOT NULL AUTO_INCREMENT,
  `xespeciesplagasidespecies` int NOT NULL,
  `xespeciesplagasidplagas` int NOT NULL,
  `especiesplagasnivelriesgo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `especiesplagasnotasespecificas` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`idespeciesplagas`),
  KEY `xespeciesplagasidespecies` (`xespeciesplagasidespecies`),
  KEY `xespeciesplagasidplagas` (`xespeciesplagasidplagas`),
  CONSTRAINT `especiesplagas_ibfk_1` FOREIGN KEY (`xespeciesplagasidespecies`) REFERENCES `especies` (`idespecies`) ON DELETE CASCADE,
  CONSTRAINT `especiesplagas_ibfk_2` FOREIGN KEY (`xespeciesplagasidplagas`) REFERENCES `plagas` (`idplagas`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `especiesplagas` VALUES(1,10,1,'media','Sugerido por IA');
INSERT INTO `especiesplagas` VALUES(2,10,2,'media','Sugerido por IA');
INSERT INTO `especiesplagas` VALUES(3,10,4,'media','Sugerido por IA');
INSERT INTO `especiesplagas` VALUES(4,10,5,'media','Sugerido por IA');
INSERT INTO `especiesplagas` VALUES(5,10,3,'media','Sugerido por IA');

DROP TABLE IF EXISTS `especiesusuarios`;
CREATE TABLE `especiesusuarios` (
  `idespeciesusuarios` int NOT NULL AUTO_INCREMENT,
  `xespeciesusuariosidusuarios` int DEFAULT NULL,
  `xespeciesusuariosidespecies` int DEFAULT NULL,
  `especiesusuariosnombre` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiesusuariosnombrecientifico` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiesusuariosfamilia` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiesusuariostipo` set('hortaliza','fruta','aromatica','leguminosa','cereal') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiesusuariosciclo` set('anual','bianual','perenne') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiesusuarioshistoria` text COLLATE utf8mb4_general_ci,
  `especiesusuariosdescripcion` text COLLATE utf8mb4_general_ci,
  `especiesusuarioscolor` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiesusuariostamano` enum('pequeno','mediano','grande') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `especiesusuariosfuentesinformacion` text COLLATE utf8mb4_general_ci,
  `especiesusuariosactivosino` tinyint(1) DEFAULT NULL,
  `especiesusuariosviabilidadsemilla` decimal(8,2) DEFAULT NULL,
  `especiesusuariossemillerodesde` int DEFAULT NULL,
  `especiesusuariossemillerohasta` int DEFAULT NULL,
  `especiesusuariossiembredirectadesde` int DEFAULT NULL,
  `especiesusuariossiembradirectahasta` int DEFAULT NULL,
  `especiesusuariostrasplantedesde` int DEFAULT NULL,
  `especiesusuariostrasplantehasta` int DEFAULT NULL,
  `especiesusuariosrecolecciondesde` int DEFAULT NULL,
  `especiesusuariosrecoleccionhasta` int DEFAULT NULL,
  `especiesusuariosdiashastafructificacion` int DEFAULT NULL,
  `especiesusuariostemperaturaminima` decimal(8,2) DEFAULT NULL,
  `especiesusuariostemperaturaoptima` decimal(8,2) DEFAULT NULL,
  `especiesusuariosmarcoplantas` decimal(8,2) DEFAULT NULL,
  `especiesusuariosmarcofilas` decimal(8,2) DEFAULT NULL,
  `especiesusuariosprofundidadsiembra` decimal(8,2) DEFAULT NULL,
  `especiesusuariosautosuficiencia` decimal(8,2) DEFAULT NULL,
  `especiesusuariosautosuficienciaconserva` decimal(8,2) DEFAULT NULL,
  `especiesusuariosdiasgerminacion` int DEFAULT NULL,
  PRIMARY KEY (`idespeciesusuarios`),
  UNIQUE KEY `usuario_id` (`xespeciesusuariosidusuarios`,`xespeciesusuariosidespecies`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `especiesusuarios` VALUES(1,1,7,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO `especiesusuarios` VALUES(3,1,11,'Pepino','Cucumis sativus','Cucurbit+','hortaliza,fruta','anual','Originario de la India, cultivado hace m+','Cultivo de porte rastrero/trepador famoso por su gran nivel de hidrataci+',NULL,'mediano',NULL,1,'5.00',3,5,4,6,4,5,6,9,55,'12.00','25.00','40.00','100.00','2.00',NULL,NULL,8);
INSERT INTO `especiesusuarios` VALUES(10,1,3,'Tomatey','Solanum lycopersicum','Solanaceae','hortaliza,fruta','anual,bianual','El tomate (Solanum lycopersicum) es originario de la regi+','Planta herb+','Rojo','grande','infoagro.com, es.wikipedia.org, agromatica.es, planteaenverde.es, infojardin.com, elrincon-verde.com',1,'4.50',2,4,1,5,4,6,7,11,100,'11.00','25.00','45.00','100.00','0.75','4.00','13.00',8);
INSERT INTO `especiesusuarios` VALUES(17,1,4,'Pimiento','Capsicum annuum','Solan+','hortaliza,fruta','anual,perenne','Originario de Centroam+','Hortaliza de fruto que requiere altas temperaturas (m+',NULL,'mediano',NULL,1,'3.00',2,4,NULL,NULL,4,6,7,10,75,'12.00','25.00','40.00','60.00','1.00',NULL,NULL,12);
INSERT INTO `especiesusuarios` VALUES(48,2,10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);

DROP TABLE IF EXISTS `labores`;
CREATE TABLE `labores` (
  `idlabores` int NOT NULL AUTO_INCREMENT,
  `laboresnombre` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `laboresdescripcion` text COLLATE utf8mb4_general_ci,
  `laboresicono` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'mdi-tools',
  `laborescolor` varchar(20) COLLATE utf8mb4_general_ci DEFAULT '#64748b',
  `laboresactivosino` tinyint(1) DEFAULT '1',
  `laboresfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idlabores`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `labores` VALUES(1,'Riego','Suministro de agua a las plantas','💧','#3b82f6',1,'2026-04-15 13:28:36');
INSERT INTO `labores` VALUES(2,'Escardado','Eliminaci ','mdi-shovel','#10b981',1,'2026-04-15 13:28:36');
INSERT INTO `labores` VALUES(3,'Abonado','Aporte de nutrientes (compost, purines, abono)','mdi-bottle-tonic-plus','#f59e0b',1,'2026-04-15 13:28:36');
INSERT INTO `labores` VALUES(4,'Poda','Corte de ramas, chupones o partes secas','mdi-content-cut','#ef4444',1,'2026-04-15 13:28:36');
INSERT INTO `labores` VALUES(5,'Entutorado','Colocaci ','mdi-format-line-spacing','#8b5cf6',1,'2026-04-15 13:28:36');
INSERT INTO `labores` VALUES(6,'Tratamiento Fitosanitario','Control de plagas o preventivo (jab ','mdi-bug-check','#06b6d4',1,'2026-04-15 13:28:36');
INSERT INTO `labores` VALUES(7,'Aclareo','Eliminaci ','mdi-vector-difference','#ec4899',1,'2026-04-15 13:28:36');
INSERT INTO `labores` VALUES(8,'Acolchado','Colocaci ','mdi-layers','#78350f',1,'2026-04-15 13:28:36');
INSERT INTO `labores` VALUES(9,'Cosecha','Recolecci ','mdi-basket','#f97316',1,'2026-04-15 13:28:36');
INSERT INTO `labores` VALUES(10,'Laboreo','Remover la tierra profundamente o preparar el terreno','mdi-tractor','#475569',1,'2026-04-15 13:28:36');
INSERT INTO `labores` VALUES(11,'Otros','Otras labores no categorizadas','mdi-tag-outline','#94a3b8',1,'2026-04-15 13:30:32');
INSERT INTO `labores` VALUES(12,'Siembra','Labor de colocar la semilla en la tierra para su germinación.','🌱','#10b981',1,'2026-04-28 10:41:42');
INSERT INTO `labores` VALUES(13,'Transplante','Labor de trasladar una planta de un lugar a otro.','🪴','#3b82f6',1,'2026-04-28 10:41:42');

DROP TABLE IF EXISTS `laboresrealizadas`;
CREATE TABLE `laboresrealizadas` (
  `idlaboresrealizadas` int NOT NULL AUTO_INCREMENT,
  `xlaboresrealizadasidsiembras` int DEFAULT NULL,
  `xlaboresrealizadasidplantaciones` int DEFAULT NULL,
  `xlaboresrealizadasidlabores` int DEFAULT NULL,
  `laboresrealizadasfecha` date NOT NULL,
  `laboresrealizadasobservaciones` text COLLATE utf8mb4_general_ci,
  `laboresrealizadasfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idlaboresrealizadas`),
  KEY `xlaboresrealizadasidsiembras` (`xlaboresrealizadasidsiembras`),
  KEY `xlaboresrealizadasidplantaciones` (`xlaboresrealizadasidplantaciones`),
  KEY `xlaboresrealizadasidlabores` (`xlaboresrealizadasidlabores`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `plagas`;
CREATE TABLE `plagas` (
  `idplagas` int NOT NULL AUTO_INCREMENT,
  `plagasnombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plagasnombrecientifico` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plagastipo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plagasdescripcion` text COLLATE utf8mb4_unicode_ci,
  `plagascontrolorganico` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`idplagas`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `plagas` VALUES(1,'Pulgón',NULL,'plaga',NULL,NULL);
INSERT INTO `plagas` VALUES(2,'Mosca blanca',NULL,'plaga',NULL,NULL);
INSERT INTO `plagas` VALUES(3,'Araña roja',NULL,'plaga',NULL,NULL);
INSERT INTO `plagas` VALUES(4,'Oídio',NULL,'plaga',NULL,NULL);
INSERT INTO `plagas` VALUES(5,'Mildiu',NULL,'plaga',NULL,NULL);
INSERT INTO `plagas` VALUES(6,'Gusano de alambre',NULL,'plaga',NULL,NULL);

DROP TABLE IF EXISTS `plantaciones`;
CREATE TABLE `plantaciones` (
  `idplantaciones` int NOT NULL AUTO_INCREMENT,
  `xplantacionesidusuarios` int NOT NULL,
  `xplantacionesidsiembras` int DEFAULT NULL,
  `plantacionesregistro` varchar(60) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `plantacionescantidadplantada` int NOT NULL DEFAULT '1',
  `plantacionesfechaplantacion` date NOT NULL,
  `plantacionesobservaciones` text COLLATE utf8mb4_general_ci,
  `plantacionesfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `plantacionesfechaactualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idplantaciones`),
  KEY `siembra_id` (`xplantacionesidsiembras`),
  CONSTRAINT `plantaciones_chk_siembras` FOREIGN KEY (`xplantacionesidsiembras`) REFERENCES `siembras` (`idsiembras`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `plantaciones` VALUES(1,1,6,'1',5,'2026-04-13','','2026-04-13 15:40:48','2026-04-13 16:17:53');
INSERT INTO `plantaciones` VALUES(2,1,8,NULL,1,'2026-04-13','dd','2026-04-13 15:42:50','2026-04-13 15:42:50');
INSERT INTO `plantaciones` VALUES(4,1,11,'2',1,'2026-04-13','','2026-04-13 17:14:39','2026-04-13 17:14:39');
INSERT INTO `plantaciones` VALUES(5,1,12,'3',1,'2026-04-13','Cooperativa de benissa','2026-04-13 17:18:52','2026-04-13 17:18:52');
INSERT INTO `plantaciones` VALUES(6,1,13,'4',20,'2026-04-13','','2026-04-13 17:34:47','2026-04-13 17:34:47');
INSERT INTO `plantaciones` VALUES(7,1,3,'5',1,'2026-04-13','','2026-04-13 17:41:07','2026-04-13 17:41:07');
INSERT INTO `plantaciones` VALUES(8,1,14,'6',1,'2026-04-13','','2026-04-13 17:41:27','2026-04-13 17:41:27');

DROP TABLE IF EXISTS `recolecciones`;
CREATE TABLE `recolecciones` (
  `idrecolecciones` int NOT NULL AUTO_INCREMENT,
  `xrecoleccionesidusuarios` int NOT NULL,
  `xrecoleccionesidplantaciones` int NOT NULL,
  `recoleccionesfecharecoleccion` date NOT NULL,
  `recoleccionesnumerofrutos` int DEFAULT '0',
  `recoleccionesobservaciones` text COLLATE utf8mb4_general_ci,
  `recoleccionesfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idrecolecciones`),
  KEY `plantacion_id` (`xrecoleccionesidplantaciones`),
  CONSTRAINT `recolecciones_fk_plantacion` FOREIGN KEY (`xrecoleccionesidplantaciones`) REFERENCES `plantaciones` (`idplantaciones`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `recolecciones` VALUES(1,1,1,'2026-04-13',1,'','2026-04-13 16:35:26','2026-04-13 16:35:26');
INSERT INTO `recolecciones` VALUES(2,1,7,'2026-04-13',1,'','2026-04-13 17:41:13','2026-04-13 17:41:13');

DROP TABLE IF EXISTS `semillas`;
CREATE TABLE `semillas` (
  `idsemillas` int NOT NULL AUTO_INCREMENT,
  `xsemillasidusuario` int DEFAULT NULL,
  `xsemillasidvariedad` int NOT NULL,
  `semillasfecharecoleccion` date DEFAULT NULL,
  `semillasorigen` enum('cosecha_propia','regalada','sobre','Plantel Comprado') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'cosecha_propia',
  `semillasobservaciones` text COLLATE utf8mb4_general_ci,
  `semillasnumeroordenacion` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `semillasnumero` varchar(60) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `semillasfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `semillasfechaactualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `semillasfechavalidez` date DEFAULT NULL,
  `semillasactivosino` tinyint(1) NOT NULL DEFAULT '1',
  `semillasfechainactivacion` date DEFAULT NULL,
  `semillasfechacompraplantel` date DEFAULT NULL,
  PRIMARY KEY (`idsemillas`),
  KEY `variedad_id` (`xsemillasidvariedad`),
  CONSTRAINT `semillas_ibfk_1` FOREIGN KEY (`xsemillasidvariedad`) REFERENCES `variedades` (`idvariedades`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `semillas` VALUES(4,1,4,'2015-06-01','','Se desestima el lote por fecha de caducidad y por ausencia de germinacion','2',NULL,'2026-04-02 14:28:50','2026-04-06 17:16:01','2019-06-01',0,NULL,NULL);
INSERT INTO `semillas` VALUES(7,1,3,'2026-04-23','','',NULL,NULL,'2026-04-02 17:05:37','2026-04-03 10:20:24','2027-04-23',0,NULL,NULL);
INSERT INTO `semillas` VALUES(8,1,46,'2026-03-03','',NULL,NULL,NULL,'2026-04-03 13:38:34','2026-04-03 13:38:34',NULL,1,NULL,NULL);
INSERT INTO `semillas` VALUES(9,1,48,'2025-01-01','','','6',NULL,'2026-04-06 16:27:31','2026-04-13 13:16:54','2029-01-01',1,NULL,NULL);
INSERT INTO `semillas` VALUES(10,1,4,'2017-06-01','','Realmente sonbn dos sobre',NULL,NULL,'2026-04-06 17:47:36','2026-04-06 17:47:36','2021-06-01',1,NULL,NULL);
INSERT INTO `semillas` VALUES(11,1,51,'2024-09-01','','','51',NULL,'2026-04-06 17:52:04','2026-04-13 13:51:52','2028-09-01',1,NULL,NULL);
INSERT INTO `semillas` VALUES(12,1,1,'2015-01-01','','Se inactiva por falta de germinacion','1',NULL,'2026-04-06 18:05:28','2026-04-13 13:27:26','2019-01-01',1,NULL,NULL);
INSERT INTO `semillas` VALUES(13,1,52,'2017-01-13','','kkj',NULL,NULL,'2026-04-12 22:00:00','2026-04-13 13:17:10','2021-01-01',1,NULL,NULL);
INSERT INTO `semillas` VALUES(14,1,1,NULL,'Plantel Comprado','Generado autom+',NULL,NULL,'2026-04-13 17:14:27','2026-04-13 17:14:27',NULL,1,NULL,'2026-04-13');
INSERT INTO `semillas` VALUES(15,1,1,NULL,'Plantel Comprado','Generado autom+',NULL,NULL,'2026-04-13 17:18:38','2026-04-13 17:18:38',NULL,1,NULL,'2026-04-13');
INSERT INTO `semillas` VALUES(16,1,51,NULL,'Plantel Comprado','Generado autom+',NULL,NULL,'2026-04-13 17:34:38','2026-04-13 17:34:38',NULL,1,NULL,'2026-04-13');
INSERT INTO `semillas` VALUES(17,1,46,NULL,'Plantel Comprado','Generado autom+',NULL,NULL,'2026-04-13 17:41:23','2026-04-13 17:41:23',NULL,1,NULL,'2026-04-13');

DROP TABLE IF EXISTS `siembras`;
CREATE TABLE `siembras` (
  `idsiembras` int NOT NULL AUTO_INCREMENT,
  `Xsiembrasidusuarios` int DEFAULT NULL,
  `Xsiembrasidsemillas` int NOT NULL,
  `siembrasgerminacionnumero` varchar(60) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `siembrasnumero` varchar(60) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `siembrastipo` varchar(30) COLLATE utf8mb4_general_ci DEFAULT 'Directa',
  `siembrasfecha` date NOT NULL,
  `siembrasgerminacion` date DEFAULT NULL,
  `siembrasfechatransplante` date DEFAULT NULL,
  `siembrasobservaciones` text COLLATE utf8mb4_general_ci,
  `Siembrasfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Siembrasfechaactualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `siembrasactivosino` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idsiembras`),
  KEY `semilla_id` (`Xsiembrasidsemillas`),
  CONSTRAINT `siembras_ibfk_1` FOREIGN KEY (`Xsiembrasidsemillas`) REFERENCES `semillas` (`idsemillas`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `siembras` VALUES(3,1,8,NULL,NULL,'Semillero','2026-03-30',NULL,NULL,'Siembra de demostraci+','2026-04-03 13:38:34','2026-04-03 13:38:34',1);
INSERT INTO `siembras` VALUES(4,1,9,NULL,NULL,'Semillero','2026-03-15','2026-03-22',NULL,'','2026-04-06 16:43:16','2026-04-06 16:43:16',1);
INSERT INTO `siembras` VALUES(5,1,4,NULL,NULL,'Directa','2026-03-15',NULL,NULL,'','2026-04-06 17:07:08','2026-04-06 17:07:08',1);
INSERT INTO `siembras` VALUES(6,1,10,NULL,NULL,'Directa','2026-04-06',NULL,NULL,'','2026-04-06 17:48:10','2026-04-06 17:48:10',1);
INSERT INTO `siembras` VALUES(7,1,11,NULL,NULL,'Directa','2026-04-06',NULL,NULL,'25 semuillas','2026-04-06 17:52:36','2026-04-06 17:52:36',1);
INSERT INTO `siembras` VALUES(8,1,12,NULL,NULL,'Directa','2026-03-15',NULL,NULL,'','2026-04-06 18:06:32','2026-04-13 13:58:22',1);
INSERT INTO `siembras` VALUES(9,1,13,NULL,NULL,'Directa','2026-03-15',NULL,NULL,'Se inactiva por falta de germinacion','2026-04-13 07:58:19','2026-04-13 07:58:19',0);
INSERT INTO `siembras` VALUES(10,1,13,NULL,NULL,'Directa','2026-04-13','2017-01-13','2021-01-01','','2026-04-13 07:59:13','2026-04-13 07:59:13',1);
INSERT INTO `siembras` VALUES(11,1,14,NULL,NULL,'Plantel','2026-04-13',NULL,NULL,'Fase de crianza simulada (plantel de vivero)','2026-04-13 17:14:28','2026-04-13 17:14:28',1);
INSERT INTO `siembras` VALUES(12,1,15,NULL,NULL,'Plantel','2026-04-13',NULL,NULL,'Fase de crianza simulada (plantel de vivero)','2026-04-13 17:18:38','2026-04-13 17:18:38',1);
INSERT INTO `siembras` VALUES(13,1,16,NULL,NULL,'Plantel','2026-04-13',NULL,NULL,'Fase de crianza simulada (plantel de vivero)','2026-04-13 17:34:38','2026-04-13 17:34:38',1);
INSERT INTO `siembras` VALUES(14,1,17,NULL,NULL,'Plantel','2026-04-13',NULL,NULL,'Fase de crianza simulada (plantel de vivero)','2026-04-13 17:41:23','2026-04-13 17:41:23',1);

DROP TABLE IF EXISTS `suscripciones`;
CREATE TABLE `suscripciones` (
  `idsuscripciones` int NOT NULL AUTO_INCREMENT,
  `suscripcionesnombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `suscripcionesprecio` decimal(6,2) NOT NULL DEFAULT '0.00',
  `suscripcionesmesesduracion` int NOT NULL DEFAULT '1',
  `suscripcionesactiva` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`idsuscripciones`),
  UNIQUE KEY `uq_suscripciones_nombre` (`suscripcionesnombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `suscripciones` VALUES(1,'B+','0.00',1,1);
INSERT INTO `suscripciones` VALUES(2,'Normal','4.99',1,1);
INSERT INTO `suscripciones` VALUES(3,'Premium','9.99',1,1);

DROP TABLE IF EXISTS `suscripcionesavisos`;
CREATE TABLE `suscripcionesavisos` (
  `idsuscripcionesavisos` int NOT NULL AUTO_INCREMENT,
  `xsuscripcionesavisosidusuarios` int DEFAULT NULL,
  `xsuscripcionesavisosidavisosglobales` int DEFAULT NULL,
  `suscripcionesavisosactivosino` tinyint(1) DEFAULT NULL,
  `suscripcionesavisosfrecuencia` int DEFAULT NULL,
  `suscripcionesavisosfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idsuscripcionesavisos`),
  UNIQUE KEY `u_aviso` (`xsuscripcionesavisosidusuarios`,`xsuscripcionesavisosidavisosglobales`),
  KEY `aviso_global_id` (`xsuscripcionesavisosidavisosglobales`),
  CONSTRAINT `suscripcionesavisos_ibfk_1` FOREIGN KEY (`xsuscripcionesavisosidusuarios`) REFERENCES `usuarios` (`idusuarios`) ON DELETE CASCADE,
  CONSTRAINT `suscripcionesavisos_ibfk_2` FOREIGN KEY (`xsuscripcionesavisosidavisosglobales`) REFERENCES `avisosglobales` (`idavisosglobales`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `suscripcionescaracteristicas`;
CREATE TABLE `suscripcionescaracteristicas` (
  `idsuscripcionescaracteristicas` int NOT NULL AUTO_INCREMENT,
  `suscripcionescaracteristicasclave` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `suscripcionescaracteristicastipo` enum('booleano','entero','cadena') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'booleano',
  `suscripcionescaracteristicasdescripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`idsuscripcionescaracteristicas`),
  UNIQUE KEY `uq_caracteristicas_clave` (`suscripcionescaracteristicasclave`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `suscripcionescaracteristicas` VALUES(1,'limite_plantas','entero','N+');
INSERT INTO `suscripcionescaracteristicas` VALUES(2,'limite_fotos_por_planta','entero','N+');
INSERT INTO `suscripcionescaracteristicas` VALUES(3,'limite_ofertas_intercambio','entero','N+');
INSERT INTO `suscripcionescaracteristicas` VALUES(4,'rastreador_ia','booleano','Acceso al Rastreador IA (identificaci+');
INSERT INTO `suscripcionescaracteristicas` VALUES(5,'alertas_clima_avanzado','booleano','Alertas de heladas/sequ+');
INSERT INTO `suscripcionescaracteristicas` VALUES(6,'planificador_rotacion','booleano','Recomendaciones autom+');
INSERT INTO `suscripcionescaracteristicas` VALUES(7,'exportacion_pdf','booleano','Generaci+');
INSERT INTO `suscripcionescaracteristicas` VALUES(8,'crear_grupos_chat','booleano','Capacidad de crear nuevos grupos de chat');
INSERT INTO `suscripcionescaracteristicas` VALUES(9,'recordatorios_push','booleano','Recordatorios autom+');
INSERT INTO `suscripcionescaracteristicas` VALUES(10,'sello_semillero_verificado','booleano','Insignia de Semillero Verificado en intercambios');
INSERT INTO `suscripcionescaracteristicas` VALUES(11,'busqueda_avanzada_catalogo','booleano','Filtros avanzados en el cat+');
INSERT INTO `suscripcionescaracteristicas` VALUES(12,'timeline_visual','booleano','Hist+');
INSERT INTO `suscripcionescaracteristicas` VALUES(13,'guardar_favoritos_catalogo','booleano','Guardar especies favoritas en el cat+');

DROP TABLE IF EXISTS `suscripcioneslimites`;
CREATE TABLE `suscripcioneslimites` (
  `idsuscripcioneslimites` int NOT NULL AUTO_INCREMENT,
  `xsuscripcioneslimitesidsuscripciones` int NOT NULL,
  `xsuscripcioneslimitesidsuscripcionescaracteristicas` int NOT NULL,
  `suscripcioneslimitesvalor` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  PRIMARY KEY (`idsuscripcioneslimites`),
  UNIQUE KEY `uq_limites_plan_caract` (`xsuscripcioneslimitesidsuscripciones`,`xsuscripcioneslimitesidsuscripcionescaracteristicas`),
  KEY `fk_limites_caracteristica` (`xsuscripcioneslimitesidsuscripcionescaracteristicas`),
  CONSTRAINT `fk_limites_caracteristica` FOREIGN KEY (`xsuscripcioneslimitesidsuscripcionescaracteristicas`) REFERENCES `suscripcionescaracteristicas` (`idsuscripcionescaracteristicas`) ON DELETE CASCADE,
  CONSTRAINT `fk_limites_suscripcion` FOREIGN KEY (`xsuscripcioneslimitesidsuscripciones`) REFERENCES `suscripciones` (`idsuscripciones`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `suscripcioneslimites` VALUES(1,1,1,'10');
INSERT INTO `suscripcioneslimites` VALUES(2,2,1,'ilimitado');
INSERT INTO `suscripcioneslimites` VALUES(3,3,1,'ilimitado');
INSERT INTO `suscripcioneslimites` VALUES(4,1,2,'1');
INSERT INTO `suscripcioneslimites` VALUES(5,2,2,'10');
INSERT INTO `suscripcioneslimites` VALUES(6,3,2,'ilimitado');
INSERT INTO `suscripcioneslimites` VALUES(7,1,3,'1');
INSERT INTO `suscripcioneslimites` VALUES(8,2,3,'ilimitado');
INSERT INTO `suscripcioneslimites` VALUES(9,3,3,'ilimitado');
INSERT INTO `suscripcioneslimites` VALUES(10,1,4,'0');
INSERT INTO `suscripcioneslimites` VALUES(11,2,4,'0');
INSERT INTO `suscripcioneslimites` VALUES(12,3,4,'1');
INSERT INTO `suscripcioneslimites` VALUES(13,1,5,'0');
INSERT INTO `suscripcioneslimites` VALUES(14,2,5,'0');
INSERT INTO `suscripcioneslimites` VALUES(15,3,5,'1');
INSERT INTO `suscripcioneslimites` VALUES(16,1,6,'0');
INSERT INTO `suscripcioneslimites` VALUES(17,2,6,'0');
INSERT INTO `suscripcioneslimites` VALUES(18,3,6,'1');
INSERT INTO `suscripcioneslimites` VALUES(19,1,7,'0');
INSERT INTO `suscripcioneslimites` VALUES(20,2,7,'0');
INSERT INTO `suscripcioneslimites` VALUES(21,3,7,'1');
INSERT INTO `suscripcioneslimites` VALUES(22,1,8,'0');
INSERT INTO `suscripcioneslimites` VALUES(23,2,8,'1');
INSERT INTO `suscripcioneslimites` VALUES(24,3,8,'1');
INSERT INTO `suscripcioneslimites` VALUES(25,1,9,'0');
INSERT INTO `suscripcioneslimites` VALUES(26,2,9,'1');
INSERT INTO `suscripcioneslimites` VALUES(27,3,9,'1');
INSERT INTO `suscripcioneslimites` VALUES(28,1,10,'0');
INSERT INTO `suscripcioneslimites` VALUES(29,2,10,'0');
INSERT INTO `suscripcioneslimites` VALUES(30,3,10,'1');
INSERT INTO `suscripcioneslimites` VALUES(31,1,11,'0');
INSERT INTO `suscripcioneslimites` VALUES(32,2,11,'1');
INSERT INTO `suscripcioneslimites` VALUES(33,3,11,'1');
INSERT INTO `suscripcioneslimites` VALUES(34,1,12,'0');
INSERT INTO `suscripcioneslimites` VALUES(35,2,12,'1');
INSERT INTO `suscripcioneslimites` VALUES(36,3,12,'1');
INSERT INTO `suscripcioneslimites` VALUES(37,1,13,'0');
INSERT INTO `suscripcioneslimites` VALUES(38,2,13,'1');
INSERT INTO `suscripcioneslimites` VALUES(39,3,13,'1');

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `idusuarios` int NOT NULL AUTO_INCREMENT,
  `usuariosnombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuariosnombreusuario` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuariosapellidos` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuariosemail` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuarioscontrasena` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuariosroles` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuariosfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `usuariospais` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuarioscodigopostal` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuariospoblacion` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuarioslatitud` decimal(10,8) DEFAULT NULL,
  `usuarioslongitud` decimal(11,8) DEFAULT NULL,
  `usuariosfechadenacimiento` date DEFAULT NULL,
  `usuariossexo` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuariosicono` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'mdi-account-circle',
  `usuariospoliticaprivacidad` tinyint(1) DEFAULT '0',
  `usuariosfechaprivacidad` timestamp NULL DEFAULT NULL,
  `usuariosemailverificado` tinyint(1) DEFAULT '0',
  `usuariosactivo` tinyint(1) NOT NULL DEFAULT '1',
  `usuariosfechainactivo` timestamp NULL DEFAULT NULL,
  `usuarioshasdisfrutadopremium` tinyint NOT NULL DEFAULT '0',
  `usuarios_stripe_customer_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuarios_paypal_payer_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuariosestadocuenta` enum('activa','borrado_pendiente','anonimizada','revision_manual') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activa',
  `usuariosfechasolicitudborrado` datetime DEFAULT NULL,
  `usuarioscontadorcancelaciones` int NOT NULL DEFAULT '0',
  `usuariosfechapimeracancelacion` datetime DEFAULT NULL,
  `usuariosdomicilio` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuariostelefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuarioszonaclimatica` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuariostipocalendario` enum('Normal','Lunar','Biodinámico') COLLATE utf8mb4_unicode_ci DEFAULT 'Normal',
  PRIMARY KEY (`idusuarios`),
  UNIQUE KEY `email` (`usuariosemail`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` VALUES(1,'Juan','jadoctor','Illueca Sanchis','jaillueca@gmail.com','$2y$10$4WYBI2EV9aiiwLVig25BguL3jEw6Oa1hzZKzCN5JnuGHNmS5vD75G','usuario,superadministrador','2026-04-02 15:28:24','Espa+','03720','Benissa','38.71492000','0.04849000','2010-01-24','Hombre',NULL,1,'2026-04-18 19:05:03',0,1,NULL,0,NULL,NULL,'',NULL,0,NULL,NULL,NULL,NULL,'Lunar');
INSERT INTO `usuarios` VALUES(2,'Pedro','Pedro','Labrador','pedro@agricola.com','$2y$10$IIkXyJXiD.cTY.Swko6xPuYW7ldjFtKVB/awEWHaXsYySOzp53QEW','usuario','2026-04-02 15:40:02','Espa+','03720','Benissa','38.71492000','0.04849000',NULL,NULL,'',1,'2026-04-20 12:26:44',0,1,NULL,0,NULL,NULL,'activa',NULL,0,'2026-04-22 14:46:55',NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(3,'Maria','Maria','Torres','maria@agricola.com','$2y$10$gF0MfqaYFPTQxGG0F6o.kOmp5PqeMXGQ6DYJ8X6AFfItt2ksL21d.','b+','2026-04-02 15:40:02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'??',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(4,'Carlos','Carlos','Huerta','carlos@agricola.com','$2y$10$gF0MfqaYFPTQxGG0F6o.kOmp5PqeMXGQ6DYJ8X6AFfItt2ksL21d.','b+','2026-04-02 15:40:02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'??',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(5,'Campesino1','Campesino1_D+','Marina Alta','denia@huerto.local','$2y$10$MkfifhofH1MiU8p9ReIhaOEeNMdHvU8c50q3FPFN5C47E9z68Exaq','usuario,b+','2026-04-18 18:26:40','Espa+','03700','D+','38.84078000','0.10574000',NULL,NULL,'',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(6,'Campesino2','Campesino2_J+','Marina Alta','javea@huerto.local','$2y$10$dWe4alivZ8RDX3kpr60wpO8MBcNtn34dvQg4dismJVMA1yN98v9Fq','usuario,b+','2026-04-18 18:26:42','Espa+','03730','J+','38.78333000','0.16667000',NULL,NULL,'',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(7,'Campesino3','Campesino3_Calpe','Marina Alta','calpe@huerto.local','$2y$10$qz2nOS2XZsxRNrnPRx2YCu7vYlSNp0cRoWl86LTWzTmfl4w0plhBu','usuario,b+','2026-04-18 18:26:44','Espa+','03710','Calpe','38.64470000','0.04450000',NULL,NULL,'',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(8,'Campesino4','Campesino4_Teulada','Marina Alta','teulada@huerto.local','$2y$10$vYsSldTHHyGZCwJ7ew.qS.LkEsneHGzephGnOyxeN1aSGlHZ7.Zk2','usuario,b+','2026-04-18 18:26:46','Espa+','03724','Teulada','38.72940000','0.10383000',NULL,NULL,'',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(9,'Campesino5','Campesino5_Benissa','Marina Alta','benissa@huerto.local','$2y$10$qcD78jsPmppE9FqfqKpcAuI1p80l5vDPp/6rmZUTA/rtQYSVQU.mm','usuario,b+','2026-04-18 18:26:48','Espa+','03720','Benissa','38.71492000','0.04849000',NULL,NULL,'',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(10,'Campesino6','Campesino6_Pego','Marina Alta','pego@huerto.local','$2y$10$zC1/PnLawCkZwbaAmbcjeOXpbIQ73ppJpQsYiWsJsFyBqgcy/.cJG','usuario,b+','2026-04-18 18:26:50','Espa+','03780','Pego','38.84305000','-0.11707000',NULL,NULL,'',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(11,'Campesino7','Campesino7_Pedreguer','Marina Alta','pedreguer@huerto.local','$2y$10$O89onNYombMQN5gXikSlZe3vZRz/bv.sPxd8JqFd.iLkqNHMZc9L2','usuario,b+','2026-04-18 18:26:52','Espa+','03750','Pedreguer','38.79312000','0.03411000',NULL,NULL,'',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(12,'Campesino8','Campesino8_Ondara','Marina Alta','ondara@huerto.local','$2y$10$sz3IuGjCWzqkV54o7gxs2O.tXFc.5LkaTtGTLocRRtCmBFnYUUXSe','usuario,b+','2026-04-18 18:26:53','Espa+','03760','Ondara','38.82817000','0.01720000',NULL,NULL,'',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(13,'Campesino9','Campesino9_Gata de Gorgos','Marina Alta','gatadegorgos@huerto.local','$2y$10$XsAXO9AHWIzPFmr3f0OVD.ITcwfWe272ykxJk4R7Ymte0HxqMBwB2','usuario,b+','2026-04-18 18:26:55','Espa+','03740','Gata de Gorgos','38.77443000','0.08538000',NULL,NULL,'',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(14,'Campesino10','Campesino10_El Verger','Marina Alta','elverger@huerto.local','$2y$10$UOdX8k8z7L6aY8utcUzHfuL74BoRJ.eCJ1OvsS3hbWQejKQZI78ma','usuario,b+','2026-04-18 18:26:57','Espa+','03770','El Verger','38.84709000','0.01034000',NULL,NULL,'',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(16,'','test.avatar','','test.avatar@verdantia.local','firebase_auth','usuario','2026-04-24 08:53:27',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mdi-account-circle',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(18,'Juan Alberto','centromedicoilueca','','centromedicoilueca@gmail.com','firebase_auth','visitante','2026-04-24 13:55:16','España','03720','Benissa',NULL,NULL,'0519-09-19','Hombre','mdi-account-circle',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(20,'Juan alberto','nehexec451','Illueca Sanchis','nehexec451@poisonword.com','firebase_auth','usuario','2026-04-24 18:34:22','España','03720','Benissa',NULL,NULL,'1961-04-24','Hombre','mdi-account-circle',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(21,'Juan Alberto','juan','','centromedicoillueca@gmail.com','firebase_auth','usuario','2026-04-25 14:03:23','España','03720','Benissa',NULL,NULL,'1969-05-19','Hombre','🦚',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(22,'Tomate','bc89gvs3se','','bc89gvs3se@bwmyga.com','firebase_auth','usuario','2026-04-25 16:54:37','Colombia','050001','Medellin',NULL,NULL,'2001-01-11','Mujer','mdi-account-circle',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(23,'','saludporalimentos','','saludporalimentos@gmail.com','firebase_auth','visitante','2026-04-25 17:54:39',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mdi-account-circle',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(24,'Juan alberto','geabmvufsa','','geabmvufsa@lnovic.com','firebase_auth','visitante','2026-04-25 20:27:41','España','03720','Benissa',NULL,NULL,'1966-04-25','Hombre','mdi-account-circle',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');
INSERT INTO `usuarios` VALUES(25,'Juan Alberto','4y2inkw2wj','','4y2inkw2wj@wnbaldwy.com','firebase_auth','usuario','2026-04-26 08:44:38','España','03720','Benissa',NULL,NULL,'1969-05-19','Hombre','mdi-account-circle',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Biodinámico');
INSERT INTO `usuarios` VALUES(26,'','jailluteca','','jailluteca@gmail.com','firebase_auth','visitante','2026-04-29 12:48:07',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'mdi-account-circle',0,NULL,0,1,NULL,0,NULL,NULL,'activa',NULL,0,NULL,NULL,NULL,NULL,'Normal');

DROP TABLE IF EXISTS `usuarios_logros`;
CREATE TABLE `usuarios_logros` (
  `id_registro` int NOT NULL AUTO_INCREMENT,
  `idusuarios` int NOT NULL,
  `nombre_logro` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_desbloqueo` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_registro`),
  UNIQUE KEY `user_logro_unique` (`idusuarios`,`nombre_logro`),
  CONSTRAINT `fk_logros_usuarios` FOREIGN KEY (`idusuarios`) REFERENCES `usuarios` (`idusuarios`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios_logros` VALUES(8,20,'Campesino Aprendiz','2026-04-24 18:38:57');
INSERT INTO `usuarios_logros` VALUES(9,21,'Campesino Aprendiz','2026-04-25 16:18:41');
INSERT INTO `usuarios_logros` VALUES(10,22,'Campesino Aprendiz','2026-04-25 17:00:10');
INSERT INTO `usuarios_logros` VALUES(11,25,'Campesino Aprendiz','2026-04-26 08:45:25');

DROP TABLE IF EXISTS `usuarios_passkeys`;
CREATE TABLE `usuarios_passkeys` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userEmail` varchar(255) NOT NULL,
  `credentialID` varchar(500) NOT NULL,
  `publicKey` text NOT NULL,
  `counter` bigint NOT NULL DEFAULT '0',
  `transports` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `credentialID` (`credentialID`(255))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `usuarios_passkeys` VALUES(1,'centromedicoillueca@gmail.com','ZTQtRzNoTmZwb2RVS1RqUlRUZF9RQQ','pQECAyYgASFYIEUFF5bvtJ+c3ABCrR1fVz4g/F4iWCVpr6cw5UxPUdwgIlggBJBiLfoetFgc/NV1D49Rd3zRLG37jnJ3o82H77fGRcw=',0,'hybrid,internal','2026-04-25 18:01:08');
INSERT INTO `usuarios_passkeys` VALUES(2,'centromedicoillueca@gmail.com','VU5zeXpvaWltVFJ5di00RmlOTFpiQQ','pQECAyYgASFYIODOafZTKI7K5vwbDwigiwYYvPyGvssPgqEHcofzqvLtIlggK6UxNqvIeGRt3G/M0ZJS8zxDEOXpvkETKn7xk1YwzT4=',0,'hybrid,internal','2026-04-25 18:02:23');
INSERT INTO `usuarios_passkeys` VALUES(3,'centromedicoillueca@gmail.com','ekRxaXNrUkZQQ0tKLWNNcThzNmYzQQ','pQECAyYgASFYIATSaFyBRuhDJl4j+PsvVV95i7p8ktXLKbddHPaW9EbjIlggv5OVDbd+BwcEeXzryZHlJ2YmKgg8NdjWj5Ekcdjja7k=',0,'hybrid,internal','2026-04-25 18:56:22');
INSERT INTO `usuarios_passkeys` VALUES(4,'jaillueca@gmail.com','X3o1b2FEbFFjQ2ZoMGpEMnZSbkRpUQ','pQECAyYgASFYIEZ7l7OqpUdjDbkrbLAXjlpxA6o2Jk+MmFa4mImFshgWIlggfmQmCZFfHnkCNIck48hVg1ZcOEi2T4r8h9YEadsumMg=',0,'hybrid,internal','2026-04-26 20:06:25');
INSERT INTO `usuarios_passkeys` VALUES(5,'jaillueca@gmail.com','a19NQzNaU19MYTN4NDZQN1k2b3Fsdw','pQECAyYgASFYIF5atn5Fz/m10P64e9gRlfruVHrYk8FSkSTfsFPXO27SIlggiiPmQv4Hb8DtRtQxoP4S9ZWuAOrDBuLJI1rV9uYBqaE=',0,'hybrid,internal','2026-04-27 09:48:35');
INSERT INTO `usuarios_passkeys` VALUES(6,'jaillueca@gmail.com','VlhFSHpLS3FaaWxTSnh6LXFGZTJyUQ','pQECAyYgASFYIG2NfVgsge2yI2s6NgvBvrO0glLF/4WIqCSpOVzmYEbdIlggZ56mClLsQ9PrIDTdtY8/1tHywOX+SKWMcgRXD8sMIdw=',0,'hybrid,internal','2026-04-29 12:32:05');

DROP TABLE IF EXISTS `usuarioscancelaciones`;
CREATE TABLE `usuarioscancelaciones` (
  `idusuarioscancelaciones` int NOT NULL AUTO_INCREMENT,
  `xusuarioscancelacionesidusuarios` int NOT NULL,
  `usuarioscancelacionesfechasolicitud` datetime NOT NULL,
  `usuarioscancelacionesmotivocancelacion` text COLLATE utf8mb4_general_ci,
  `usuarioscancelacionesfechareactivacion` datetime DEFAULT NULL,
  `usuarioscancelacionesfechaborradodefinitivo` datetime NOT NULL,
  PRIMARY KEY (`idusuarioscancelaciones`),
  KEY `xusuarioscancelacionesidusuarios` (`xusuarioscancelacionesidusuarios`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `usuarioscancelaciones` VALUES(1,2,'2026-04-22 14:46:55','Voy a crear una cuenta nueva','2026-04-22 14:46:57','2026-05-22 14:46:55');
INSERT INTO `usuarioscancelaciones` VALUES(2,2,'2026-04-22 14:48:12','Problemas t+','2026-04-22 14:48:15','2026-05-22 14:48:12');
INSERT INTO `usuarioscancelaciones` VALUES(3,2,'2026-04-22 15:02:47','Registro recuperado por el sistema (Causa del bloqueo)',NULL,'0000-00-00 00:00:00');

DROP TABLE IF EXISTS `usuariosdenuncias`;
CREATE TABLE `usuariosdenuncias` (
  `iddenuncia` int NOT NULL AUTO_INCREMENT,
  `xidusuariosdenunciante` int NOT NULL,
  `xidusuariosdenunciado` int NOT NULL,
  `xidchatconversaciones` int DEFAULT NULL,
  `usuariosdenunciamotivo` text COLLATE utf8mb4_general_ci NOT NULL,
  `usuariosdenunciafecha` datetime DEFAULT CURRENT_TIMESTAMP,
  `usuariosdenunciaestado` enum('pendiente','revisada','desestimada') COLLATE utf8mb4_general_ci DEFAULT 'pendiente',
  `usuariosdenunciaurgente` tinyint(1) DEFAULT '1',
  `usuariosdenuncianotasadmin` text COLLATE utf8mb4_general_ci,
  `usuariosdenunciaresolucion` varchar(80) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `usuariosdenunciafecharevisada` datetime DEFAULT NULL,
  `xidusuariosrevisor` int DEFAULT NULL,
  PRIMARY KEY (`iddenuncia`),
  KEY `xidusuariosdenunciante` (`xidusuariosdenunciante`),
  KEY `xidusuariosdenunciado` (`xidusuariosdenunciado`),
  CONSTRAINT `usuariosdenuncias_ibfk_1` FOREIGN KEY (`xidusuariosdenunciante`) REFERENCES `usuarios` (`idusuarios`),
  CONSTRAINT `usuariosdenuncias_ibfk_2` FOREIGN KEY (`xidusuariosdenunciado`) REFERENCES `usuarios` (`idusuarios`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `usuariosdenuncias` VALUES(1,2,1,5,'es  un pringao','2026-04-22 16:13:12','revisada',1,NULL,'restriccion_chat_7d','2026-04-22 17:41:03',1);

DROP TABLE IF EXISTS `usuariosdenunciassanciones`;
CREATE TABLE `usuariosdenunciassanciones` (
  `idsancion` int NOT NULL AUTO_INCREMENT,
  `xidsancioniddenuncia` int NOT NULL,
  `xidsancionidusuario` int NOT NULL,
  `sanciontipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sancionfechainicio` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sancionfechafin` datetime DEFAULT NULL,
  `sancionactiva` tinyint(1) NOT NULL DEFAULT '1',
  `sancionfechacierre` datetime DEFAULT NULL,
  `xidsancionidusuariocierre` int DEFAULT NULL,
  `xidsancionpadre` int DEFAULT NULL,
  PRIMARY KEY (`idsancion`),
  KEY `idx_usuario` (`xidsancionidusuario`),
  KEY `idx_denuncia` (`xidsancioniddenuncia`),
  KEY `idx_activa` (`sancionactiva`),
  KEY `idx_fechafin` (`sancionfechafin`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuariosdenunciassanciones` VALUES(1,1,1,'restriccion_chat_7d','2026-04-22 17:41:03','2026-04-29 17:41:03',0,NULL,NULL,NULL);
INSERT INTO `usuariosdenunciassanciones` VALUES(2,1,1,'bloqueo_contacto_30d','2026-04-22 18:50:40','2026-05-22 18:50:40',0,NULL,NULL,NULL);
INSERT INTO `usuariosdenunciassanciones` VALUES(3,1,1,'restriccion_chat_7d','2026-04-22 20:31:48','2026-04-29 20:31:48',0,'2026-04-22 20:32:07',1,NULL);
INSERT INTO `usuariosdenunciassanciones` VALUES(4,1,1,'restriccion_chat_7d','2026-04-22 20:32:07','2026-04-25 20:32:07',1,NULL,NULL,3);

DROP TABLE IF EXISTS `usuariospagos`;
CREATE TABLE `usuariospagos` (
  `idusuariospagos` int NOT NULL AUTO_INCREMENT,
  `xusuariospagositdusuarios` int NOT NULL,
  `xusuariospagositdusuariossuscripciones` int DEFAULT NULL,
  `usuariospagosimporte` decimal(6,2) NOT NULL DEFAULT '0.00',
  `usuariospagosmetodopago` enum('stripe_tarjeta','stripe_googlepay','paypal') COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuariospagospasarelatransaccionid` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuariospagosfechapago` datetime NOT NULL,
  `usuariospagosestadopago` enum('completado','fallido','reembolsado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completado',
  PRIMARY KEY (`idusuariospagos`),
  KEY `idx_pagos_usuario` (`xusuariospagositdusuarios`),
  KEY `idx_pagos_fecha` (`usuariospagosfechapago`),
  KEY `fk_pagos_suscripcion` (`xusuariospagositdusuariossuscripciones`),
  CONSTRAINT `fk_pagos_suscripcion` FOREIGN KEY (`xusuariospagositdusuariossuscripciones`) REFERENCES `usuariossuscripciones` (`idusuariossuscripciones`) ON DELETE SET NULL,
  CONSTRAINT `fk_pagos_usuario` FOREIGN KEY (`xusuariospagositdusuarios`) REFERENCES `usuarios` (`idusuarios`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `usuariossuscripciones`;
CREATE TABLE `usuariossuscripciones` (
  `idusuariossuscripciones` int NOT NULL AUTO_INCREMENT,
  `xusuariossuscripcionesidsuscripciones` int NOT NULL,
  `xusuariossuscripcionesidusuarios` int NOT NULL,
  `usuariossuscripcionesfechainicio` datetime NOT NULL,
  `usuariossuscripcionesfechafin` datetime DEFAULT NULL,
  `usuariossuscripcionesestado` enum('activa','cancelada','finalizada','degradacion_fase1','degradacion_fase2','degradacion_fase3') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activa',
  `usuariossuscripcionesrenovacionautomatica` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`idusuariossuscripciones`),
  KEY `idx_ussub_usuario` (`xusuariossuscripcionesidusuarios`),
  KEY `idx_ussub_estado` (`usuariossuscripcionesestado`),
  KEY `fk_ussub_suscripcion` (`xusuariossuscripcionesidsuscripciones`),
  CONSTRAINT `fk_ussub_suscripcion` FOREIGN KEY (`xusuariossuscripcionesidsuscripciones`) REFERENCES `suscripciones` (`idsuscripciones`),
  CONSTRAINT `fk_ussub_usuario` FOREIGN KEY (`xusuariossuscripcionesidusuarios`) REFERENCES `usuarios` (`idusuarios`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuariossuscripciones` VALUES(1,3,2,'2026-04-22 12:07:43',NULL,'activa',1);
INSERT INTO `usuariossuscripciones` VALUES(2,3,1,'2026-04-22 14:50:17','2026-05-18 00:00:00','activa',1);
INSERT INTO `usuariossuscripciones` VALUES(3,3,21,'2026-04-25 18:18:42','2026-06-24 18:18:42','activa',1);
INSERT INTO `usuariossuscripciones` VALUES(4,3,22,'2026-04-25 19:00:11','2026-06-24 19:00:11','activa',1);
INSERT INTO `usuariossuscripciones` VALUES(5,3,25,'2026-04-26 10:45:26','2026-06-25 10:45:26','activa',1);

DROP TABLE IF EXISTS `variedades`;
CREATE TABLE `variedades` (
  `idvariedades` int NOT NULL AUTO_INCREMENT,
  `xvariedadesidespecies` int DEFAULT NULL,
  `variedadesnombre` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `variedadesdecripcion` text COLLATE utf8mb4_general_ci,
  `variedadescolor` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `variedadestamano` enum('pequeno','mediano','grande') COLLATE utf8mb4_general_ci DEFAULT 'mediano',
  `variedadesfechacreacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `variedadesdiasgerminacion` int DEFAULT NULL,
  `variedadesviabilidadsemilla` decimal(8,2) DEFAULT NULL,
  `variedadesdiashastafructificacion` int DEFAULT NULL,
  `variedadestemperaturaminima` decimal(8,2) DEFAULT NULL,
  `variedadestemperaturaoptima` decimal(8,2) DEFAULT NULL,
  `variedadesmarcoplantas` decimal(8,2) DEFAULT NULL,
  `variedadesmarcofilas` decimal(8,2) DEFAULT NULL,
  `variedadesprofundidadsiembra` decimal(8,2) DEFAULT NULL,
  `variedadeshistoria` text COLLATE utf8mb4_general_ci,
  `variedadessemillerodesde` int DEFAULT NULL,
  `variedadessemillerohasta` int DEFAULT NULL,
  `siembra_directa_desde` int DEFAULT NULL,
  `variedadessiembradirectahasta` int DEFAULT NULL,
  `variedadestrasplantedesde` int DEFAULT NULL,
  `variedadestrasplantehasta` int DEFAULT NULL,
  `variedadesrecolecciondesde` int DEFAULT NULL,
  `variedadesrecolecccionhasta` int DEFAULT NULL,
  `xvariedadesidusuarios` int DEFAULT NULL,
  `variedadesvisibilidadsino` tinyint(1) DEFAULT '1',
  `variedadesautosuficiencia` decimal(8,2) DEFAULT NULL,
  `variedadesautosuficienciaconserva` decimal(8,2) DEFAULT NULL,
  PRIMARY KEY (`idvariedades`),
  KEY `especie_id` (`xvariedadesidespecies`),
  CONSTRAINT `variedades_ibfk_1` FOREIGN KEY (`xvariedadesidespecies`) REFERENCES `especies` (`idespecies`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `variedades` VALUES(1,3,'Valenciano gordal','','Rojo','mediano','2026-04-02 11:23:18',8,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,'',2,4,4,5,4,6,7,11,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(2,3,'Cherry','Tomate pequeno, muy dulce y productivo. Ideal para ensaladas y snacks. [NOTA: Calendario Espec+','Rojo','pequeno','2026-04-02 11:23:31',8,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,3,4,5,3,5,6,11,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(3,3,'Raf','Tomate asurcado de sabor intenso. Tipico de Almeria. [NOTA: Calendario Espec+','Verde-Rojo','grande','2026-04-02 11:23:31',8,'1.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,8,10,4,5,9,11,12,5,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(4,3,'Corazon de Buey','Tomate grande, acorazonado, poca semilla. Ideal para rodajas.','Rosa-Rojo','grande','2026-04-02 11:23:31',7,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,4,4,5,4,6,7,11,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(5,3,'Kumato','Tomate oscuro de piel fina y sabor concentrado.','Marron-Verde','mediano','2026-04-02 11:23:31',8,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,4,4,5,4,6,7,11,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(6,3,'Pera','Tomate alargado ideal para conservas y salsas.','Rojo','mediano','2026-04-02 11:23:31',8,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,4,4,5,4,6,7,11,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(7,3,'Rosa de Barbastro','Tomate rosa grande, dulce y carnoso. Variedad aragonesa.','Rosa','grande','2026-04-02 11:23:31',8,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,4,4,5,4,6,7,11,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(8,3,'Muchamiel','Variedad tradicional valenciana, asurcado y sabroso. [NOTA: Calendario Espec+','Rojo','grande','2026-04-02 11:23:31',8,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,12,2,4,5,2,4,5,8,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(9,3,'Monterosa','Tomate rosa tipo pata negra, muy cotizado.','Rosa','grande','2026-04-02 11:23:31',8,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,4,4,5,4,6,7,11,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(10,3,'Tres Cantos','Variedad clasica espanola, redondo y uniforme.','Rojo','mediano','2026-04-02 11:23:31',8,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,4,4,5,4,6,7,11,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(11,3,'Marmande','Tomate achatado y asurcado, carnoso y sabroso. [NOTA: Calendario Espec+','Rojo','grande','2026-04-02 11:23:31',8,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,12,2,4,5,2,4,5,8,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(12,3,'Valenciano Gordal Plus','Tomate tipico valenciano, forma irregular, muy sabroso.','Rojo','mediano','2026-04-02 15:23:20',8,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,4,4,5,4,6,7,11,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(13,4,'Pimiento de Padr+',NULL,'Verde','pequeno','2026-04-02 15:57:52',12,'3.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,4,0,0,4,6,7,10,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(14,4,'Pimiento Morr+',NULL,'Rojo','grande','2026-04-02 15:57:52',12,'3.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,4,0,0,4,6,7,10,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(15,4,'Pimiento Italiano',NULL,'Verde','mediano','2026-04-02 15:57:52',12,'3.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,4,0,0,4,6,7,10,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(16,4,'Pimiento del Piquillo',NULL,'Rojo','pequeno','2026-04-02 15:57:52',12,'3.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,4,0,0,4,6,7,10,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(17,5,'Listada de Gand+','','Blanca y Morada',NULL,'2026-04-02 15:57:52',14,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,4,0,0,4,6,7,10,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(18,5,'Negra Larga',NULL,'Negra','grande','2026-04-02 15:57:52',14,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,4,0,0,4,6,7,10,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(19,5,'Blanca','','Blanca',NULL,'2026-04-02 15:57:52',1,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,4,0,0,4,6,7,10,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(20,6,'Babosa',NULL,'Blanca','grande','2026-04-02 15:57:52',10,'2.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,12,3,0,0,3,5,6,8,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(21,6,'Morada de Amposta',NULL,'Morada','grande','2026-04-02 15:57:52',10,'2.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,12,3,0,0,3,5,6,8,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(22,6,'Figueres',NULL,'Rosada','','2026-04-02 15:57:52',10,'2.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,12,3,0,0,3,5,6,8,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(23,6,'Larga de Florencia',NULL,'Roja','','2026-04-02 15:57:52',10,'2.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,12,3,0,0,3,5,6,8,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(27,8,'Romana','','Verde','grande','2026-04-02 15:57:52',7,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,10,0,0,3,10,3,12,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(28,8,'Maravilla de Verano','','Verde y Roja',NULL,'2026-04-02 15:57:52',7,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,10,0,0,3,10,3,12,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(29,8,'Hoja de Roble',NULL,'Rojiza','','2026-04-02 15:57:52',7,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,10,0,0,3,10,3,12,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(30,8,'Iceberg',NULL,'Verde claro','grande','2026-04-02 15:57:52',7,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,10,0,0,3,10,3,12,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(31,9,'Nantesa',NULL,'Naranja','','2026-04-02 15:57:52',15,'3.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,2,11,0,0,5,12,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(32,9,'Chantenay',NULL,'Naranja intensa','','2026-04-02 15:57:52',15,'3.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,2,11,0,0,5,12,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(33,9,'Morada',NULL,'Morada','','2026-04-02 15:57:52',15,'3.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,2,11,0,0,5,12,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(34,10,'Verde','','Verde oscuro','pequeno','2026-04-02 15:57:52',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'',3,5,4,6,4,5,6,10,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(35,10,'Blanco Medio Largo',NULL,'Blanco/Verde claro','mediano','2026-04-02 15:57:52',10,'3.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,3,5,4,6,4,5,6,10,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(36,10,'Redondo de Niza','','Verde claro',NULL,'2026-04-02 15:57:52',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'',2,5,3,6,4,7,6,10,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(37,11,'Espa+',NULL,'Verde oscuro','pequeno','2026-04-02 15:57:52',8,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,3,5,4,6,4,5,6,9,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(38,11,'Holand+',NULL,'Verde','grande','2026-04-02 15:57:52',8,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,3,5,4,6,4,5,6,9,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(39,11,'Franc+',NULL,'Verde','mediano','2026-04-02 15:57:52',8,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,3,5,4,6,4,5,6,9,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(40,12,'Redondo Rojo',NULL,'Rojo','pequeno','2026-04-02 15:57:52',5,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,1,12,0,0,2,12,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(41,12,'Daikon (Japon+',NULL,'Blanco','grande','2026-04-02 15:57:52',5,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,1,12,0,0,2,12,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(42,12,'Medio Largo','','Rojo punta blanca','mediano','2026-04-02 15:57:52',5,'5.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,1,12,0,0,2,12,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(43,13,'Viroflay',NULL,'Verde oscuro','grande','2026-04-02 15:57:52',8,'4.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,8,2,0,0,10,4,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(44,13,'Gigante de Invierno',NULL,'Verde','grande','2026-04-02 15:57:52',8,'4.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,8,2,0,0,10,4,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(45,13,'Matador',NULL,'Verde oscuro','','2026-04-02 15:57:52',8,'4.00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,8,2,0,0,10,4,NULL,1,NULL,NULL);
INSERT INTO `variedades` VALUES(46,3,'Demo Cherry STORM+',NULL,NULL,'mediano','2026-04-03 13:38:34',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,NULL);
INSERT INTO `variedades` VALUES(48,3,'Negro de Crimea','Tomate oscuro de origen ruso, sabor complejo y dulce.','Rojo oscuro','grande','2026-04-06 15:30:06',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,NULL);
INSERT INTO `variedades` VALUES(51,3,'Valenciano Gordal Plus','Tomate tipico valenciano, forma irregular, muy sabroso.','Rojo','grande','2026-04-06 17:49:38',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,NULL,NULL);
INSERT INTO `variedades` VALUES(52,3,'Supermarmande','','','mediano','2026-04-13 07:55:30',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,NULL,NULL);

DROP TABLE IF EXISTS `variedadesusuarios`;
CREATE TABLE `variedadesusuarios` (
  `idvariedadesusuarios` int NOT NULL AUTO_INCREMENT,
  `Xvariedadesusuariosidusuarios` int DEFAULT NULL,
  `xvariedadesusuariosidvariedades` int DEFAULT NULL,
  `variedadesusuariosdiasgerminacion` int DEFAULT NULL,
  `variedadesusuariosviabilidadsemilla` decimal(8,2) DEFAULT NULL,
  `variedadesusuariosdiashastafructificacion` int DEFAULT NULL,
  `variedadesusuariostemperaturaminima` decimal(8,2) DEFAULT NULL,
  `variedadesusuariostemperaturaoptima` decimal(8,2) DEFAULT NULL,
  `variedadesusuariosmarcoplantas` decimal(8,2) DEFAULT NULL,
  `variedadesusuariosmarcofilas` decimal(8,2) DEFAULT NULL,
  `variedadesusuariosprofundidadsiembra` decimal(8,2) DEFAULT NULL,
  `variedadesusuariossemillerodesde` int DEFAULT NULL,
  `variedadesusuariossemillerohasta` int DEFAULT NULL,
  `variedadesusuariossiembredirectadesde` int DEFAULT NULL,
  `variedadesusuariossiembradirectahasta` int DEFAULT NULL,
  `variedadesusuariostrasplantedesde` int DEFAULT NULL,
  `variedadesusuariostrasplantehasta` int DEFAULT NULL,
  `variedadesusuariosrecoleciondesde` int DEFAULT NULL,
  `variedadesusuariosrecoleccionhasta` int DEFAULT NULL,
  `variedadesusuariosautosuficiencia` decimal(8,2) DEFAULT NULL,
  `variedadesusuariosautosuficienciaconserva` decimal(8,2) DEFAULT NULL,
  PRIMARY KEY (`idvariedadesusuarios`),
  UNIQUE KEY `usuario_id` (`Xvariedadesusuariosidusuarios`,`xvariedadesusuariosidvariedades`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `variedadesusuarios` VALUES(6,1,4,4,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);

DROP TABLE IF EXISTS `webauthn_challenges`;
CREATE TABLE `webauthn_challenges` (
  `email` varchar(255) NOT NULL,
  `challenge` varchar(255) NOT NULL,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `webauthn_challenges` VALUES('jaillueca@gmail.com','h6GpRhv0vDZsReiESDRIcrIRNRwAQwnJrB8jCje-wp0','2026-04-30 22:37:59');

SET FOREIGN_KEY_CHECKS=1;
