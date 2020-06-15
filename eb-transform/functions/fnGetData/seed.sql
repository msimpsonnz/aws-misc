CREATE TABLE `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_name` varchar(65535) COLLATE utf8_unicode_ci NOT NULL,
  `version` varchar(65535) COLLATE utf8_unicode_ci NOT NULL,
  `deployment_time` varchar(65535) COLLATE utf8_unicode_ci NOT NULL,
  `url` varchar(65535) COLLATE utf8_unicode_ci NOT NULL,
  `merge_hash` varchar(65535) COLLATE utf8_unicode_ci NOT NULL,
  `deployment_user` varchar(65535) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

mysqlimport --local \
            --ignore-lines=1 \
            --fields-terminated-by=, \
            -h $DBHOST -u syscdk \
            -p events \
             events.csv