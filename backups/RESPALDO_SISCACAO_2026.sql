-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: cacao_curimana
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `beneficiarios`
--

DROP TABLE IF EXISTS `beneficiarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `beneficiarios` (
  `id_beneficiario` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `dni` varchar(12) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `id_caserio` int(10) unsigned NOT NULL,
  `sector` varchar(120) DEFAULT NULL,
  `referencia` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_beneficiario`),
  UNIQUE KEY `uq_dni` (`dni`),
  KEY `fk_beneficiario_caserio` (`id_caserio`),
  CONSTRAINT `fk_beneficiario_caserio` FOREIGN KEY (`id_caserio`) REFERENCES `caserios` (`id_caserio`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `beneficiarios`
--

LOCK TABLES `beneficiarios` WRITE;
/*!40000 ALTER TABLE `beneficiarios` DISABLE KEYS */;
INSERT INTO `beneficiarios` VALUES (1,'Carlos','Rojas Diaz','58582525','985471452',1,'1','parcela',0,'2026-09-04 21:14:20','2026-09-04 21:16:36'),(2,'Winny','Pastor Garcia','71849074','901586636',1,'1','NO SE PRESENTO',1,'2026-09-04 21:37:50','2026-09-04 21:37:50');
/*!40000 ALTER TABLE `beneficiarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `caserios`
--

DROP TABLE IF EXISTS `caserios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `caserios` (
  `id_caserio` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `distrito` varchar(120) NOT NULL DEFAULT 'Curimana',
  `provincia` varchar(120) NOT NULL DEFAULT 'Padre Abad',
  `departamento` varchar(120) NOT NULL DEFAULT 'Ucayali',
  `observacion` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_caserio`),
  UNIQUE KEY `uq_caserio` (`nombre`,`distrito`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `caserios`
--

LOCK TABLES `caserios` WRITE;
/*!40000 ALTER TABLE `caserios` DISABLE KEYS */;
INSERT INTO `caserios` VALUES (1,'Curimaná','Curimaná','Padre Abad','Ucayali','',1),(2,'Nueva Esperanza','Curimaná','Padre Abad','Ucayali','Registro de prueba del sistema',1),(3,'San José','Curimaná','Padre Abad','Ucayali','Registro prueba de notificación creada correctamente desde SISCACAO',0),(4,'Jordan','Curimaná','Padre Abad','Ucayali','se encontro plagas en las hojas',1);
/*!40000 ALTER TABLE `caserios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hallazgos`
--

DROP TABLE IF EXISTS `hallazgos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hallazgos` (
  `id_hallazgo` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id_supervision` bigint(20) unsigned NOT NULL,
  `descripcion` text NOT NULL,
  `nivel` enum('BAJO','MEDIO','ALTO') NOT NULL DEFAULT 'MEDIO',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_hallazgo`),
  KEY `fk_hallazgo_supervision` (`id_supervision`),
  CONSTRAINT `fk_hallazgo_supervision` FOREIGN KEY (`id_supervision`) REFERENCES `supervisiones` (`id_supervision`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hallazgos`
--

LOCK TABLES `hallazgos` WRITE;
/*!40000 ALTER TABLE `hallazgos` DISABLE KEYS */;
INSERT INTO `hallazgos` VALUES (1,1,'se identifico muertes','MEDIO','2026-09-07 21:43:54',1);
/*!40000 ALTER TABLE `hallazgos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parcelas`
--

DROP TABLE IF EXISTS `parcelas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `parcelas` (
  `id_parcela` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_beneficiario` int(10) unsigned NOT NULL,
  `nombre_predio` varchar(120) DEFAULT NULL,
  `cultivo` varchar(80) NOT NULL DEFAULT 'Cacao',
  `area_ha` decimal(8,2) DEFAULT NULL,
  `latitud` decimal(10,7) DEFAULT NULL,
  `longitud` decimal(10,7) DEFAULT NULL,
  `observacion` text DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_parcela`),
  KEY `fk_parcela_beneficiario` (`id_beneficiario`),
  CONSTRAINT `fk_parcela_beneficiario` FOREIGN KEY (`id_beneficiario`) REFERENCES `beneficiarios` (`id_beneficiario`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parcelas`
--

LOCK TABLES `parcelas` WRITE;
/*!40000 ALTER TABLE `parcelas` DISABLE KEYS */;
INSERT INTO `parcelas` VALUES (1,2,'Cacao nº 1','Cacao',2.50,8.4350000,75.1500000,'parcela registrada correctamete',1);
/*!40000 ALTER TABLE `parcelas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recomendaciones`
--

DROP TABLE IF EXISTS `recomendaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recomendaciones` (
  `id_recomendacion` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id_supervision` bigint(20) unsigned NOT NULL,
  `id_hallazgo` bigint(20) unsigned DEFAULT NULL,
  `descripcion` text NOT NULL,
  `responsable` varchar(150) DEFAULT NULL,
  `fecha_limite` date DEFAULT NULL,
  `estado` enum('PENDIENTE','EN_PROCESO','CUMPLIDO') NOT NULL DEFAULT 'PENDIENTE',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_recomendacion`),
  KEY `fk_recomendacion_supervision` (`id_supervision`),
  KEY `idx_rec_estado` (`estado`),
  KEY `idx_rec_fecha` (`fecha_limite`),
  KEY `fk_recomendaciones_hallazgo` (`id_hallazgo`),
  CONSTRAINT `fk_recomendacion_supervision` FOREIGN KEY (`id_supervision`) REFERENCES `supervisiones` (`id_supervision`) ON DELETE CASCADE,
  CONSTRAINT `fk_recomendaciones_hallazgo` FOREIGN KEY (`id_hallazgo`) REFERENCES `hallazgos` (`id_hallazgo`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recomendaciones`
--

LOCK TABLES `recomendaciones` WRITE;
/*!40000 ALTER TABLE `recomendaciones` DISABLE KEYS */;
INSERT INTO `recomendaciones` VALUES (1,1,1,'completar las labores','Tecnico de campo','2026-09-07','EN_PROCESO',1,'2026-09-07 21:51:37','2026-09-07 22:10:19');
/*!40000 ALTER TABLE `recomendaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id_rol` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(30) NOT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'ADMINISTRADOR'),(2,'SUPERVISOR'),(3,'TECNICO');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seguimientos`
--

DROP TABLE IF EXISTS `seguimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seguimientos` (
  `id_seguimiento` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id_recomendacion` bigint(20) unsigned NOT NULL,
  `fecha` date NOT NULL,
  `estado_anterior` enum('PENDIENTE','EN_PROCESO','CUMPLIDO') NOT NULL,
  `estado_nuevo` enum('PENDIENTE','EN_PROCESO','CUMPLIDO') NOT NULL,
  `observacion` text DEFAULT NULL,
  `id_usuario` int(10) unsigned NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_seguimiento`),
  KEY `fk_seg_recomendacion` (`id_recomendacion`),
  KEY `fk_seg_usuario` (`id_usuario`),
  CONSTRAINT `fk_seg_recomendacion` FOREIGN KEY (`id_recomendacion`) REFERENCES `recomendaciones` (`id_recomendacion`) ON DELETE CASCADE,
  CONSTRAINT `fk_seg_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seguimientos`
--

LOCK TABLES `seguimientos` WRITE;
/*!40000 ALTER TABLE `seguimientos` DISABLE KEYS */;
INSERT INTO `seguimientos` VALUES (1,1,'2026-09-07','PENDIENTE','EN_PROCESO','no hay informaciòn',1,'2026-09-07 22:10:19');
/*!40000 ALTER TABLE `seguimientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supervisiones`
--

DROP TABLE IF EXISTS `supervisiones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `supervisiones` (
  `id_supervision` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id_visita` bigint(20) unsigned NOT NULL,
  `actividad_programada` text NOT NULL,
  `cumplimiento` enum('CUMPLIDO','PARCIAL','NO_CUMPLIDO') NOT NULL,
  `observacion` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_supervision`),
  KEY `fk_supervision_visita` (`id_visita`),
  CONSTRAINT `fk_supervision_visita` FOREIGN KEY (`id_visita`) REFERENCES `visitas` (`id_visita`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supervisiones`
--

LOCK TABLES `supervisiones` WRITE;
/*!40000 ALTER TABLE `supervisiones` DISABLE KEYS */;
INSERT INTO `supervisiones` VALUES (1,1,'verificacion del cultivo','CUMPLIDO','no hubo observacionees','2026-09-04 22:15:51',1);
/*!40000 ALTER TABLE `supervisiones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tecnicos`
--

DROP TABLE IF EXISTS `tecnicos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tecnicos` (
  `id_tecnico` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int(10) unsigned DEFAULT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `cargo` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_tecnico`),
  UNIQUE KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `fk_tecnicos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tecnicos`
--

LOCK TABLES `tecnicos` WRITE;
/*!40000 ALTER TABLE `tecnicos` DISABLE KEYS */;
INSERT INTO `tecnicos` VALUES (1,NULL,'Juan Carlos','Pérez Goméz','Extensionista de campo','985471552','juan@gmail.com',0,'2026-09-04 00:17:06','2026-09-04 00:20:15'),(2,NULL,'Mileidy','Placencia Pacheco','Tecnico de campo','958745896','mileydi@gmail.com',1,'2026-09-04 21:54:56','2026-09-04 21:54:56'),(3,NULL,'Lindis','Armas Zevallos','Tecnico de campo','958745896','Lindis@gmail.com',1,'2026-09-08 00:56:50','2026-09-08 00:56:50'),(4,NULL,'juan Carlos','Sanches Ruiz','Expencionista','986532147','juan@gmail.com',1,'2026-09-08 14:36:28','2026-09-08 14:36:28');
/*!40000 ALTER TABLE `tecnicos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuarios` (
  `id_usuario` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `id_rol` tinyint(3) unsigned NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `usuario` (`usuario`),
  KEY `fk_usuarios_roles` (`id_rol`),
  CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Administrador','Sistema','admin','$2b$10$VkawG5ZJZWH1Zyf09P/7s.fLKjEdJhrVMu5pkMOi/vhwDLAVJnJ42',1,1,'2026-09-03 15:39:36','2026-09-03 15:39:36');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visitas`
--

DROP TABLE IF EXISTS `visitas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `visitas` (
  `id_visita` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `id_tecnico` int(10) unsigned NOT NULL,
  `id_beneficiario` int(10) unsigned NOT NULL,
  `id_parcela` int(10) unsigned DEFAULT NULL,
  `tipo_visita` enum('ASISTENCIA_TECNICA','SUPERVISION') NOT NULL DEFAULT 'SUPERVISION',
  `objetivo` text NOT NULL,
  `latitud` decimal(10,7) DEFAULT NULL,
  `longitud` decimal(10,7) DEFAULT NULL,
  `observacion` text DEFAULT NULL,
  `id_usuario_registro` int(10) unsigned NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_visita`),
  KEY `fk_visita_tecnico` (`id_tecnico`),
  KEY `fk_visita_beneficiario` (`id_beneficiario`),
  KEY `fk_visita_parcela` (`id_parcela`),
  KEY `fk_visita_usuario` (`id_usuario_registro`),
  KEY `idx_visita_fecha` (`fecha`),
  CONSTRAINT `fk_visita_beneficiario` FOREIGN KEY (`id_beneficiario`) REFERENCES `beneficiarios` (`id_beneficiario`),
  CONSTRAINT `fk_visita_parcela` FOREIGN KEY (`id_parcela`) REFERENCES `parcelas` (`id_parcela`),
  CONSTRAINT `fk_visita_tecnico` FOREIGN KEY (`id_tecnico`) REFERENCES `tecnicos` (`id_tecnico`),
  CONSTRAINT `fk_visita_usuario` FOREIGN KEY (`id_usuario_registro`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visitas`
--

LOCK TABLES `visitas` WRITE;
/*!40000 ALTER TABLE `visitas` DISABLE KEYS */;
INSERT INTO `visitas` VALUES (1,'2026-09-04',2,2,1,'SUPERVISION','vaerificar el estado del cultivo',75.1500000,8.4350000,'no se enconctro ninguna incidencia',1,'2026-09-04 21:56:18',1),(2,'2026-09-08',2,2,1,'ASISTENCIA_TECNICA','perosnal de fumigacion',0.0000003,0.0000004,'no se encontraron',1,'2026-09-08 00:44:43',1);
/*!40000 ALTER TABLE `visitas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'cacao_curimana'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-08 17:53:20
