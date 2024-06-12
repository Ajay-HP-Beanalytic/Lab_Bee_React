-- MySQL dump 10.13  Distrib 8.0.37, for Win64 (x86_64)
--
-- Host: localhost    Database: labbee
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attachments`
--

DROP TABLE IF EXISTS `attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attachments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jc_number` varchar(1000) DEFAULT NULL,
  `file_name` varchar(1000) DEFAULT NULL,
  `file_path` varchar(1000) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attachments`
--

LOCK TABLES `attachments` WRITE;
/*!40000 ALTER TABLE `attachments` DISABLE KEYS */;
INSERT INTO `attachments` VALUES (2,'2024-2025/6-002','SWTM-2088_Atlassian-Git-Cheatsheet.pdf','D:/Lab_Bee_React/Backend/FilesUploaded/1717671566427_SWTM-2088_Atlassian-Git-Cheatsheet.pdf','application/pdf','2024-06-06 10:59:26'),(3,'2024-2025/6-002','Raghavendra.jpg','D:/Lab_Bee_React/Backend/FilesUploaded/1717671566427_Raghavendra.jpg','image/jpeg','2024-06-06 10:59:26'),(9,'2024-2025/6-004','JC_2024-2025_6-001.docx','D:/Lab_Bee_React/Backend/FilesUploaded/1717672924050_JC_2024-2025_6-001.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','2024-06-06 11:22:04'),(10,'2024-2025/6-004','Raghavendra.jpg','D:/Lab_Bee_React/Backend/FilesUploaded/1717672967678_Raghavendra.jpg','image/jpeg','2024-06-06 11:22:47'),(11,'2024-2025/6-004','SWTM-2088_Atlassian-Git-Cheatsheet.pdf','D:/Lab_Bee_React/Backend/FilesUploaded/1717672967678_SWTM-2088_Atlassian-Git-Cheatsheet.pdf','application/pdf','2024-06-06 11:22:47'),(12,'2024-2025/6-003','panda.jpg','D:/Lab_Bee_React/Backend/FilesUploaded/1717673729670_panda.jpg','image/jpeg','2024-06-06 11:35:29'),(13,'2024-2025/6-003','image1.jpg','D:/Lab_Bee_React/Backend/FilesUploaded/1717673729672_image1.jpg','image/jpeg','2024-06-06 11:35:29'),(14,'2024-2025/6-004','image1.jpg','D:/Lab_Bee_React/Backend/FilesUploaded/1717674060333_image1.jpg','image/jpeg','2024-06-06 11:41:00'),(15,'2024-2025/6-004','panda.jpg','D:/Lab_Bee_React/Backend/FilesUploaded/1717674060329_panda.jpg','image/jpeg','2024-06-06 11:41:00'),(16,'2024-2025/6-003','Employee Sample Data.xlsx','D:/Lab_Bee_React/Backend/FilesUploaded/1717676760460_Employee Sample Data.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','2024-06-06 12:26:00'),(17,'2024-2025/6-003','JC_2024-2025_6-003.docx','D:/Lab_Bee_React/Backend/FilesUploaded/1717676760470_JC_2024-2025_6-003.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document','2024-06-06 12:26:00');
/*!40000 ALTER TABLE `attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bea_jobcards`
--

DROP TABLE IF EXISTS `bea_jobcards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bea_jobcards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jc_number` varchar(255) DEFAULT NULL,
  `dcform_number` varchar(255) DEFAULT NULL,
  `jc_open_date` date DEFAULT NULL,
  `item_received_date` date DEFAULT NULL,
  `po_number` varchar(255) DEFAULT NULL,
  `test_category` varchar(1000) DEFAULT NULL,
  `type_of_request` varchar(1000) DEFAULT NULL,
  `test_incharge` varchar(1000) DEFAULT NULL,
  `jc_category` varchar(500) DEFAULT NULL,
  `company_name` varchar(1000) DEFAULT NULL,
  `customer_name` varchar(1000) DEFAULT NULL,
  `customer_email` varchar(1000) DEFAULT NULL,
  `customer_number` varchar(255) DEFAULT NULL,
  `project_name` varchar(1000) DEFAULT NULL,
  `sample_condition` varchar(500) DEFAULT NULL,
  `jc_status` varchar(500) DEFAULT NULL,
  `reliability_report_status` varchar(500) DEFAULT NULL,
  `jc_closed_date` date DEFAULT NULL,
  `observations` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bea_jobcards`
--

LOCK TABLES `bea_jobcards` WRITE;
/*!40000 ALTER TABLE `bea_jobcards` DISABLE KEYS */;
INSERT INTO `bea_jobcards` VALUES (1,'2024-2025/6-001','','2024-06-05',NULL,'','','','Bhaskar','Reliability','df','fg','sdfgfg','9845691267','dfdfh','','Open','Not Sent',NULL,'sdv','2024-06-05 09:42:04','2024-06-05 09:42:04',NULL),(2,'2024-2025/6-002','','2024-06-06','2024-06-06','','Environmental','Testing of Component','Uday','TS1','ee','ee','ee','9845691269','dded','Good','Open','',NULL,'','2024-06-06 05:59:21','2024-06-07 12:02:07',NULL),(3,'2024-2025/6-003','','2024-06-06','2024-06-06','','Screening','Equipment ','Rohith','TS1','dd','ff','ggg','9845125878','ff','Other','Open','',NULL,'','2024-06-06 06:03:25','2024-06-06 06:03:25',NULL),(4,'2024-2025/6-004','','2024-06-06',NULL,'','','','Bhaskar','Reliability','GG TRONICS','abcd','abc@gmail.com','1234566789','TCAS','','Close','On-Hold','2024-06-11','MTBF values are high','2024-06-06 11:49:13','2024-06-06 11:52:11',NULL);
/*!40000 ALTER TABLE `bea_jobcards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bea_quotations_table`
--

DROP TABLE IF EXISTS `bea_quotations_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bea_quotations_table` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quotation_ids` varchar(255) DEFAULT NULL,
  `tests` text,
  `company_name` varchar(255) DEFAULT NULL,
  `company_address` varchar(500) DEFAULT NULL,
  `quote_given_date` date DEFAULT NULL,
  `customer_id` varchar(255) DEFAULT NULL,
  `customer_referance` varchar(255) DEFAULT NULL,
  `kind_attention` varchar(255) DEFAULT NULL,
  `project_name` varchar(1000) DEFAULT NULL,
  `quote_category` varchar(255) DEFAULT NULL,
  `quote_version` varchar(255) DEFAULT NULL,
  `total_amount` varchar(255) DEFAULT NULL,
  `total_taxable_amount_in_words` varchar(1000) DEFAULT NULL,
  `quote_created_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bea_quotations_table`
--

LOCK TABLES `bea_quotations_table` WRITE;
/*!40000 ALTER TABLE `bea_quotations_table` DISABLE KEYS */;
INSERT INTO `bea_quotations_table` VALUES (1,'BEA/TS1/ACCORD/24065-001','[{\"slno\":1,\"testDescription\":\"as\",\"sacNo\":\"11\",\"duration\":150,\"unit\":\"Hour\",\"perUnitCharge\":130,\"amount\":19500,\"module_id\":0}]','Accord','No. 72 & 73, Krishna Reddy Ln, K.R.Colony, Domlur, Bengaluru, Karnataka 560071','2024-06-05','ACCORD','Email','Avinash1','APU','Environmental Testing','V1','19500','NINETEEN THOUSAND, FIVE HUNDRED','Admin');
/*!40000 ALTER TABLE `bea_quotations_table` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings_table`
--

DROP TABLE IF EXISTS `bookings_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings_table` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` varchar(255) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(255) DEFAULT NULL,
  `test_name` varchar(255) DEFAULT NULL,
  `chamber_allotted` varchar(255) DEFAULT NULL,
  `slot_start_datetime` datetime DEFAULT NULL,
  `slot_end_datetime` datetime DEFAULT NULL,
  `slot_duration` varchar(255) DEFAULT NULL,
  `remarks` varchar(2500) DEFAULT NULL,
  `slot_booked_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings_table`
--

LOCK TABLES `bookings_table` WRITE;
/*!40000 ALTER TABLE `bookings_table` DISABLE KEYS */;
INSERT INTO `bookings_table` VALUES (1,'BEATS20240612001','Accord','Anand','anand@gmail.com','9845784512','Thermal Cycling 1','TCC-2','2024-06-12 13:00:00','2024-06-12 17:00:00','4.0','Booked',NULL,'2024-06-12 07:45:55','2024-06-12 07:46:35',NULL),(2,'BEATS20240612002','aDSsd','sdfsdsd','dsgdf@gmail.com','9845126958','jiuh','TCC-2','2024-06-13 15:00:00','2024-06-13 19:00:00','4.0','sdgd',NULL,'2024-06-12 07:49:02','2024-06-12 07:49:02',NULL);
/*!40000 ALTER TABLE `bookings_table` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chamber_calibration`
--

DROP TABLE IF EXISTS `chamber_calibration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chamber_calibration` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chamber_name` varchar(1000) DEFAULT NULL,
  `chamber_id` varchar(100) DEFAULT NULL,
  `calibration_done_date` date DEFAULT NULL,
  `calibration_due_date` date DEFAULT NULL,
  `calibration_done_by` varchar(1000) DEFAULT NULL,
  `calibration_status` varchar(250) DEFAULT NULL,
  `chamber_status` varchar(250) DEFAULT NULL,
  `remarks` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chamber_calibration`
--

LOCK TABLES `chamber_calibration` WRITE;
/*!40000 ALTER TABLE `chamber_calibration` DISABLE KEYS */;
INSERT INTO `chamber_calibration` VALUES (6,'Vibration chamber-1','VIB-1','2023-07-25','2024-07-24','MKS','Expired','Good','Remarks2'),(7,'Thermal Cycling -1','TCC-1','2023-07-05','2024-07-04','World One','Up to Date','Good','Remarks3'),(8,'Thermal Cycling -2','TCC-2','2023-06-10','2024-06-09','World One','Expired','Good','Remarks4'),(9,'Thermal Cycling -3','TCC-3','2023-08-10','2024-08-09','TUV','Up to Date','Good','Remarks5'),(10,'Vibration chamber-2','VIB-2','2024-01-10','2025-01-09','MKS','Up to Date','Under Maintenance','Remarks2'),(12,'Vibration chamber-1','VIB-1','2023-07-25','2024-07-24','MKS','Expired','Good','Remarks1'),(13,'Thermal Cycling -1','TCC-1','2023-07-05','2024-07-04','World One','Up to Date','Good','Remarks3'),(14,'Thermal Cycling -33','TCC-33','2023-06-11','2024-06-10','World One','Up to Date','Under Maintenance','Remarks5');
/*!40000 ALTER TABLE `chamber_calibration` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chambers_list`
--

DROP TABLE IF EXISTS `chambers_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chambers_list` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chamber_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chambers_list`
--

LOCK TABLES `chambers_list` WRITE;
/*!40000 ALTER TABLE `chambers_list` DISABLE KEYS */;
INSERT INTO `chambers_list` VALUES (4,'TCC-2');
/*!40000 ALTER TABLE `chambers_list` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers_details`
--

DROP TABLE IF EXISTS `customers_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_name` varchar(1000) DEFAULT NULL,
  `company_address` varchar(2000) DEFAULT NULL,
  `contact_person` varchar(1000) DEFAULT NULL,
  `company_id` varchar(500) DEFAULT NULL,
  `customer_referance` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers_details`
--

LOCK TABLES `customers_details` WRITE;
/*!40000 ALTER TABLE `customers_details` DISABLE KEYS */;
INSERT INTO `customers_details` VALUES (1,'Accord','No. 72 & 73, Krishna Reddy Ln, K.R.Colony, Domlur, Bengaluru, Karnataka 560071','Avinash k','ACCORD','Email'),(2,'Mistral','Adarsh Regent, 60, 100 Ft, Ring Rd, AK Colony, Domlur I Stage, 1st Stage, Domlur, Bengaluru, Karnataka 560071','Mahesh','MISTRAL','Email'),(3,'Bosch','Po No.9501, Naganathpura Unit, Bengaluru, Bangalore - 560095','Anand','BOSCH','Phone');
/*!40000 ALTER TABLE `customers_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eut_details`
--

DROP TABLE IF EXISTS `eut_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eut_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jc_number` varchar(255) DEFAULT NULL,
  `nomenclature` varchar(1000) DEFAULT NULL,
  `eutDescription` varchar(2000) DEFAULT NULL,
  `qty` varchar(1000) DEFAULT NULL,
  `partNo` varchar(1000) DEFAULT NULL,
  `modelNo` varchar(1000) DEFAULT NULL,
  `serialNo` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eut_details`
--

LOCK TABLES `eut_details` WRITE;
/*!40000 ALTER TABLE `eut_details` DISABLE KEYS */;
INSERT INTO `eut_details` VALUES (1,'2024-2025/6-001','wef','f','f','f','g','gg'),(2,'2024-2025/6-003','sdf','ff','1','cc','bjh','11');
/*!40000 ALTER TABLE `eut_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_soft_modules`
--

DROP TABLE IF EXISTS `item_soft_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_soft_modules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `module_name` varchar(1000) DEFAULT NULL,
  `module_description` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_soft_modules`
--

LOCK TABLES `item_soft_modules` WRITE;
/*!40000 ALTER TABLE `item_soft_modules` DISABLE KEYS */;
INSERT INTO `item_soft_modules` VALUES (1,'MDBF','Mean Distance Between Failures'),(2,'MTTR','Mean Time To Repair'),(3,'MDBCF','Mean Distance Between Component Failures'),(4,'MDBF','Mean Distance Between Failures'),(5,'MTTR','Mean Time To Repair');
/*!40000 ALTER TABLE `item_soft_modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jc_tests`
--

DROP TABLE IF EXISTS `jc_tests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jc_tests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jc_number` varchar(255) DEFAULT NULL,
  `test` varchar(1000) DEFAULT NULL,
  `nabl` varchar(255) DEFAULT NULL,
  `testStandard` varchar(1000) DEFAULT NULL,
  `referenceDocument` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jc_tests`
--

LOCK TABLES `jc_tests` WRITE;
/*!40000 ALTER TABLE `jc_tests` DISABLE KEYS */;
INSERT INTO `jc_tests` VALUES (1,'2024-2025/6-001','dfvdf','nabl','dfgh','hhj'),(2,'2024-2025/6-003','asd','nabl','dd','dff');
/*!40000 ALTER TABLE `jc_tests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `labbee_users`
--

DROP TABLE IF EXISTS `labbee_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `labbee_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `user_status` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `labbee_users`
--

LOCK TABLES `labbee_users` WRITE;
/*!40000 ALTER TABLE `labbee_users` DISABLE KEYS */;
INSERT INTO `labbee_users` VALUES (1,'Ajay HP','ajay.h@beanalytic.com','$2b$10$cqhnZYzvmSJ09fYzBfANX.BCTdgs8TjiJgp4N.wTaic0h4B8LjxLm','Administrator','Administrator','Enable'),(2,'Rohit','rohit@beanalytic.com','$2b$10$YUBNtAPUELUyJ0QP1FfZl.uclVeN4vmoIjqsWS5VMlGCiDUdR2m/6','TS1 Testing','Lab Manager','Enable'),(3,'Uday','Uday.MN@beanalytic.com','$2b$10$5aCqUWb6u9u6YXKQ1jTwZ.PQe968pfirzyZl757xPqqjh07MbOZZG','TS1 Testing','Lab Engineer','Enable'),(4,'Anil Kumar Ammina','anilkr.ammina@beanalytic.com','$2b$10$WDNW1Xoi54KrsWj/PE7wS.qekIB81/SfQyuQRRUZXrctOyMkbeQbu','Administrator','Managing Director','Enable'),(5,'Suresh Patri','suresh.patri@beanalytic.com','$2b$10$WsJxRgrqtdfaB4A.QrBaze11G1xOa8NsdHsLYM0v1rHhAC8/Ke0Xi','Administrator','Operations Manager','Enable'),(6,'Banani S','banani.s@beanalytic.com','$2b$10$VvVEv3MwSI0adNBOk1AIwuUfqBc582Q6MfijeHmP8gx71Ie.qzQr2','Accounts','Accounts','Enable'),(7,'Bhaskar P','bhaskar.p@beanalytic.com','$2b$10$eGAMt6DqGoCtiQ8BdPh.7e9QGD3FtmcCox6vXNyx/nfz6mZn0o8Ae','Reliability','Reliability Manager','Enable'),(8,'Supreeth AP','Supreeth.AP@beanalytic.com','$2b$10$NYNPkBjS1rb5D6ksX.ofBubzTXlTJWiLYSA34ik/pii9Nn8pjhKCi','Reliability','Reliability Engineer','Enable'),(9,'Raghunandana','raghu.raju@beanalytic.com','$2b$10$vn/Wm.QtK/LoFWMo2pMALeMWgfu6roG9lJEPzs/ygEtH.aPUisqLu','Administrator','Administrator','Enable'),(10,'Kiran J','Kiran.J@beanalytic.com','$2b$10$UDAVq2RPb1vOS/YrBonxqOQLC3wbFEWPwmW39XULZVTK/Sq9Qb9/K','Software','Software Engineer','Enable');
/*!40000 ALTER TABLE `labbee_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_codes`
--

DROP TABLE IF EXISTS `otp_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `otp_code` varchar(6) NOT NULL,
  `otp_expiry` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_codes`
--

LOCK TABLES `otp_codes` WRITE;
/*!40000 ALTER TABLE `otp_codes` DISABLE KEYS */;
INSERT INTO `otp_codes` VALUES (2,'beanalyticsol@gmail.com','292895','2024-06-04 15:17:08'),(3,'beanalyticsol@gmail.com','334760','2024-06-04 15:19:13'),(4,'beanalyticsol@gmail.com','117723','2024-06-04 15:21:08');
/*!40000 ALTER TABLE `otp_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_attempts`
--

DROP TABLE IF EXISTS `password_reset_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `attempts` int DEFAULT '0',
  `last_attempt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_attempts`
--

LOCK TABLES `password_reset_attempts` WRITE;
/*!40000 ALTER TABLE `password_reset_attempts` DISABLE KEYS */;
INSERT INTO `password_reset_attempts` VALUES (1,'ajay.h@beanalytic.com',1,'2024-06-07 14:45:27'),(2,'beanalyticsol@gmail.com',3,'2024-06-04 09:45:08'),(3,'jprashanthi@beanalytic.com',3,'2024-06-04 10:16:03');
/*!40000 ALTER TABLE `password_reset_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `po_invoice_table`
--

DROP TABLE IF EXISTS `po_invoice_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `po_invoice_table` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jc_number` varchar(255) DEFAULT NULL,
  `jc_month` date DEFAULT NULL,
  `jc_category` varchar(255) DEFAULT NULL,
  `rfq_number` varchar(255) DEFAULT NULL,
  `rfq_value` varchar(255) DEFAULT NULL,
  `po_number` varchar(255) DEFAULT NULL,
  `po_value` varchar(255) DEFAULT NULL,
  `po_status` varchar(255) DEFAULT NULL,
  `invoice_number` varchar(255) DEFAULT NULL,
  `invoice_value` varchar(255) DEFAULT NULL,
  `invoice_status` varchar(255) DEFAULT NULL,
  `payment_status` varchar(255) DEFAULT NULL,
  `remarks` varchar(2500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `po_invoice_table`
--

LOCK TABLES `po_invoice_table` WRITE;
/*!40000 ALTER TABLE `po_invoice_table` DISABLE KEYS */;
INSERT INTO `po_invoice_table` VALUES (1,'JC-1','2024-06-05','TS1','wsw','15000','ww','15000','PO Received','ww','15000','Invoice Sent','Payment Received','ss','2024-06-05 07:01:51','2024-06-05 07:01:51',NULL);
/*!40000 ALTER TABLE `po_invoice_table` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reliability_tasks`
--

DROP TABLE IF EXISTS `reliability_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reliability_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_description` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reliability_tasks`
--

LOCK TABLES `reliability_tasks` WRITE;
/*!40000 ALTER TABLE `reliability_tasks` DISABLE KEYS */;
INSERT INTO `reliability_tasks` VALUES (1,'MTBF');
/*!40000 ALTER TABLE `reliability_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reliability_tasks_details`
--

DROP TABLE IF EXISTS `reliability_tasks_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reliability_tasks_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jc_number` varchar(255) DEFAULT NULL,
  `task_description` varchar(1000) DEFAULT NULL,
  `task_assigned_by` varchar(1000) DEFAULT NULL,
  `task_start_date` date DEFAULT NULL,
  `task_end_date` date DEFAULT NULL,
  `task_assigned_to` varchar(1000) DEFAULT NULL,
  `task_status` varchar(1000) DEFAULT NULL,
  `task_completed_date` date DEFAULT NULL,
  `note_remarks` varchar(5000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reliability_tasks_details`
--

LOCK TABLES `reliability_tasks_details` WRITE;
/*!40000 ALTER TABLE `reliability_tasks_details` DISABLE KEYS */;
INSERT INTO `reliability_tasks_details` VALUES (1,'2024-2025/6-001','MTBF','Bhaskar',NULL,NULL,NULL,NULL,NULL,NULL),(2,'2024-2025/6-004','MTBF','Bhaskar','2024-06-06','2024-06-12','Prashanthi','On-Going','2024-06-11','NA');
/*!40000 ALTER TABLE `reliability_tasks_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tests_details`
--

DROP TABLE IF EXISTS `tests_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tests_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jc_number` varchar(255) DEFAULT NULL,
  `testName` varchar(1000) DEFAULT NULL,
  `testChamber` varchar(1000) DEFAULT NULL,
  `eutSerialNo` varchar(1000) DEFAULT NULL,
  `standard` varchar(1000) DEFAULT NULL,
  `testStartedBy` varchar(500) DEFAULT NULL,
  `startTemp` varchar(500) DEFAULT NULL,
  `startRh` varchar(500) DEFAULT NULL,
  `startDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  `duration` varchar(2000) DEFAULT NULL,
  `endTemp` varchar(500) DEFAULT NULL,
  `endRh` varchar(500) DEFAULT NULL,
  `testEndedBy` varchar(500) DEFAULT NULL,
  `remarks` varchar(2000) DEFAULT NULL,
  `reportNumber` varchar(500) DEFAULT NULL,
  `preparedBy` varchar(500) DEFAULT NULL,
  `nablUploaded` varchar(500) DEFAULT NULL,
  `reportStatus` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tests_details`
--

LOCK TABLES `tests_details` WRITE;
/*!40000 ALTER TABLE `tests_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `tests_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ts1_tests`
--

DROP TABLE IF EXISTS `ts1_tests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ts1_tests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_name` varchar(1000) DEFAULT NULL,
  `test_code` varchar(100) DEFAULT NULL,
  `test_description` varchar(2000) DEFAULT NULL,
  `test_category` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ts1_tests`
--

LOCK TABLES `ts1_tests` WRITE;
/*!40000 ALTER TABLE `ts1_tests` DISABLE KEYS */;
/*!40000 ALTER TABLE `ts1_tests` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-06-12 16:30:00
