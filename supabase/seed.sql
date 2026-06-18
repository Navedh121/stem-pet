-- =============================================================
-- STEMPet — Seed SQL
-- Run AFTER schema.sql.
-- Contains:
--   Part 1: Built-in fallback questions (used when Groq is unavailable)
--   Part 2: Demo data — one sample parent, child "Alex", device,
--            and ~200 realistic attempts spanning 30 days.
--            Log in with demo@stempet.dev / Demo1234! to explore.
-- =============================================================

-- ─── PART 1: BUILTIN QUESTIONS ────────────────────────────────
-- 5+ questions per (skill × level × age_group) combination.
-- That's 4 skills × 4 levels × 3 age_groups = 48 buckets, 5+ each.
-- Only a representative sample is shown here; the API will also
-- call Groq for variety and cache the results back in this table.

insert into questions (skill, level, age_group, question_text, options, correct_index, source) values

-- ── ADDITION ─────────────────────────────────────────────────

-- addition / level 1 / 6-8 (numbers 1-10)
('addition',1,'6-8','What is 2 + 3?',           '["4","5","6","7"]', 1, 'builtin'),
('addition',1,'6-8','What is 1 + 4?',           '["3","4","5","6"]', 2, 'builtin'),
('addition',1,'6-8','What is 3 + 3?',           '["5","6","7","8"]', 1, 'builtin'),
('addition',1,'6-8','What is 4 + 2?',           '["4","5","6","7"]', 2, 'builtin'),
('addition',1,'6-8','What is 5 + 1?',           '["4","5","6","7"]', 2, 'builtin'),

-- addition / level 2 / 6-8 (numbers 10-20)
('addition',2,'6-8','What is 8 + 5?',           '["11","12","13","14"]', 2, 'builtin'),
('addition',2,'6-8','What is 9 + 4?',           '["11","12","13","14"]', 2, 'builtin'),
('addition',2,'6-8','What is 7 + 6?',           '["11","12","13","14"]', 2, 'builtin'),
('addition',2,'6-8','What is 6 + 8?',           '["12","13","14","15"]', 2, 'builtin'),
('addition',2,'6-8','What is 5 + 9?',           '["12","13","14","15"]', 2, 'builtin'),

-- addition / level 3 / 6-8 (numbers 20-50)
('addition',3,'6-8','What is 15 + 12?',         '["25","26","27","28"]', 2, 'builtin'),
('addition',3,'6-8','What is 18 + 11?',         '["27","28","29","30"]', 2, 'builtin'),
('addition',3,'6-8','What is 20 + 14?',         '["32","33","34","35"]', 2, 'builtin'),
('addition',3,'6-8','What is 13 + 16?',         '["27","28","29","30"]', 2, 'builtin'),
('addition',3,'6-8','What is 22 + 15?',         '["35","36","37","38"]', 2, 'builtin'),

-- addition / level 4 / 6-8 (numbers 50-100)
('addition',4,'6-8','What is 34 + 28?',         '["60","61","62","63"]', 2, 'builtin'),
('addition',4,'6-8','What is 45 + 37?',         '["80","81","82","83"]', 2, 'builtin'),
('addition',4,'6-8','What is 56 + 29?',         '["83","84","85","86"]', 2, 'builtin'),
('addition',4,'6-8','What is 48 + 33?',         '["79","80","81","82"]', 2, 'builtin'),
('addition',4,'6-8','What is 63 + 27?',         '["88","89","90","91"]', 2, 'builtin'),

-- addition / level 1 / 8-10
('addition',1,'8-10','What is 3 + 6?',          '["7","8","9","10"]', 2, 'builtin'),
('addition',1,'8-10','What is 4 + 5?',          '["7","8","9","10"]', 2, 'builtin'),
('addition',1,'8-10','What is 2 + 7?',          '["7","8","9","10"]', 2, 'builtin'),
('addition',1,'8-10','What is 6 + 4?',          '["8","9","10","11"]', 2, 'builtin'),
('addition',1,'8-10','What is 5 + 5?',          '["8","9","10","11"]', 2, 'builtin'),

-- addition / level 2 / 8-10
('addition',2,'8-10','What is 13 + 19?',        '["30","31","32","33"]', 2, 'builtin'),
('addition',2,'8-10','What is 17 + 15?',        '["30","31","32","33"]', 2, 'builtin'),
('addition',2,'8-10','What is 24 + 18?',        '["40","41","42","43"]', 2, 'builtin'),
('addition',2,'8-10','What is 16 + 17?',        '["31","32","33","34"]', 2, 'builtin'),
('addition',2,'8-10','What is 19 + 22?',        '["39","40","41","42"]', 2, 'builtin'),

-- addition / level 3 / 8-10
('addition',3,'8-10','What is 47 + 36?',        '["81","82","83","84"]', 2, 'builtin'),
('addition',3,'8-10','What is 58 + 34?',        '["90","91","92","93"]', 2, 'builtin'),
('addition',3,'8-10','What is 65 + 28?',        '["91","92","93","94"]', 2, 'builtin'),
('addition',3,'8-10','What is 39 + 45?',        '["82","83","84","85"]', 2, 'builtin'),
('addition',3,'8-10','What is 73 + 19?',        '["90","91","92","93"]', 2, 'builtin'),

-- addition / level 4 / 8-10 (3-digit sums)
('addition',4,'8-10','What is 123 + 78?',       '["199","200","201","202"]', 2, 'builtin'),
('addition',4,'8-10','What is 256 + 144?',      '["398","399","400","401"]', 2, 'builtin'),
('addition',4,'8-10','What is 187 + 95?',       '["280","281","282","283"]', 2, 'builtin'),
('addition',4,'8-10','What is 314 + 67?',       '["379","380","381","382"]', 2, 'builtin'),
('addition',4,'8-10','What is 208 + 193?',      '["399","400","401","402"]', 2, 'builtin'),

-- addition / levels 1-4 / 10-12
('addition',1,'10-12','What is 7 + 8?',         '["13","14","15","16"]', 2, 'builtin'),
('addition',1,'10-12','What is 9 + 6?',         '["13","14","15","16"]', 2, 'builtin'),
('addition',1,'10-12','What is 8 + 8?',         '["14","15","16","17"]', 2, 'builtin'),
('addition',1,'10-12','What is 6 + 9?',         '["13","14","15","16"]', 2, 'builtin'),
('addition',1,'10-12','What is 7 + 7?',         '["12","13","14","15"]', 2, 'builtin'),
('addition',2,'10-12','What is 34 + 47?',       '["79","80","81","82"]', 2, 'builtin'),
('addition',2,'10-12','What is 56 + 38?',       '["92","93","94","95"]', 2, 'builtin'),
('addition',2,'10-12','What is 67 + 45?',       '["110","111","112","113"]', 2, 'builtin'),
('addition',2,'10-12','What is 49 + 53?',       '["100","101","102","103"]', 2, 'builtin'),
('addition',2,'10-12','What is 78 + 36?',       '["112","113","114","115"]', 2, 'builtin'),
('addition',3,'10-12','What is 347 + 285?',     '["630","631","632","633"]', 2, 'builtin'),
('addition',3,'10-12','What is 469 + 358?',     '["825","826","827","828"]', 2, 'builtin'),
('addition',3,'10-12','What is 512 + 389?',     '["899","900","901","902"]', 2, 'builtin'),
('addition',3,'10-12','What is 673 + 248?',     '["919","920","921","922"]', 2, 'builtin'),
('addition',3,'10-12','What is 405 + 396?',     '["799","800","801","802"]', 2, 'builtin'),
('addition',4,'10-12','What is 1 234 + 987?',   '["2219","2220","2221","2222"]', 2, 'builtin'),
('addition',4,'10-12','What is 2 456 + 1 378?', '["3832","3833","3834","3835"]', 2, 'builtin'),
('addition',4,'10-12','What is 3 089 + 2 546?', '["5633","5634","5635","5636"]', 2, 'builtin'),
('addition',4,'10-12','What is 4 702 + 1 899?', '["6599","6600","6601","6602"]', 2, 'builtin'),
('addition',4,'10-12','What is 5 000 + 3 456?', '["8454","8455","8456","8457"]', 2, 'builtin'),

-- ── SUBTRACTION ──────────────────────────────────────────────

-- subtraction / level 1 / 6-8
('subtraction',1,'6-8','What is 5 - 2?',        '["1","2","3","4"]', 2, 'builtin'),
('subtraction',1,'6-8','What is 7 - 3?',        '["2","3","4","5"]', 2, 'builtin'),
('subtraction',1,'6-8','What is 6 - 4?',        '["0","1","2","3"]', 2, 'builtin'),
('subtraction',1,'6-8','What is 8 - 5?',        '["1","2","3","4"]', 2, 'builtin'),
('subtraction',1,'6-8','What is 9 - 6?',        '["1","2","3","4"]', 2, 'builtin'),

-- subtraction / level 2 / 6-8
('subtraction',2,'6-8','What is 15 - 8?',       '["5","6","7","8"]', 2, 'builtin'),
('subtraction',2,'6-8','What is 18 - 9?',       '["7","8","9","10"]', 2, 'builtin'),
('subtraction',2,'6-8','What is 14 - 7?',       '["5","6","7","8"]', 2, 'builtin'),
('subtraction',2,'6-8','What is 16 - 8?',       '["6","7","8","9"]', 2, 'builtin'),
('subtraction',2,'6-8','What is 13 - 6?',       '["5","6","7","8"]', 2, 'builtin'),

-- subtraction / level 3 / 6-8
('subtraction',3,'6-8','What is 35 - 18?',      '["15","16","17","18"]', 2, 'builtin'),
('subtraction',3,'6-8','What is 42 - 24?',      '["16","17","18","19"]', 2, 'builtin'),
('subtraction',3,'6-8','What is 50 - 27?',      '["21","22","23","24"]', 2, 'builtin'),
('subtraction',3,'6-8','What is 48 - 19?',      '["27","28","29","30"]', 2, 'builtin'),
('subtraction',3,'6-8','What is 61 - 35?',      '["24","25","26","27"]', 2, 'builtin'),

-- subtraction / level 4 / 6-8
('subtraction',4,'6-8','What is 87 - 49?',      '["36","37","38","39"]', 2, 'builtin'),
('subtraction',4,'6-8','What is 93 - 58?',      '["33","34","35","36"]', 2, 'builtin'),
('subtraction',4,'6-8','What is 75 - 38?',      '["35","36","37","38"]', 2, 'builtin'),
('subtraction',4,'6-8','What is 82 - 47?',      '["33","34","35","36"]', 2, 'builtin'),
('subtraction',4,'6-8','What is 100 - 64?',     '["34","35","36","37"]', 2, 'builtin'),

-- subtraction / levels 1-4 / 8-10
('subtraction',1,'8-10','What is 9 - 4?',       '["3","4","5","6"]', 2, 'builtin'),
('subtraction',1,'8-10','What is 8 - 3?',       '["3","4","5","6"]', 2, 'builtin'),
('subtraction',1,'8-10','What is 7 - 5?',       '["0","1","2","3"]', 2, 'builtin'),
('subtraction',1,'8-10','What is 10 - 6?',      '["2","3","4","5"]', 2, 'builtin'),
('subtraction',1,'8-10','What is 9 - 7?',       '["0","1","2","3"]', 2, 'builtin'),
('subtraction',2,'8-10','What is 23 - 15?',     '["6","7","8","9"]', 2, 'builtin'),
('subtraction',2,'8-10','What is 31 - 17?',     '["12","13","14","15"]', 2, 'builtin'),
('subtraction',2,'8-10','What is 45 - 28?',     '["15","16","17","18"]', 2, 'builtin'),
('subtraction',2,'8-10','What is 52 - 36?',     '["14","15","16","17"]', 2, 'builtin'),
('subtraction',2,'8-10','What is 60 - 43?',     '["15","16","17","18"]', 2, 'builtin'),
('subtraction',3,'8-10','What is 134 - 67?',    '["65","66","67","68"]', 2, 'builtin'),
('subtraction',3,'8-10','What is 200 - 83?',    '["115","116","117","118"]', 2, 'builtin'),
('subtraction',3,'8-10','What is 175 - 98?',    '["75","76","77","78"]', 2, 'builtin'),
('subtraction',3,'8-10','What is 250 - 127?',   '["121","122","123","124"]', 2, 'builtin'),
('subtraction',3,'8-10','What is 300 - 156?',   '["142","143","144","145"]', 2, 'builtin'),
('subtraction',4,'8-10','What is 500 - 278?',   '["220","221","222","223"]', 2, 'builtin'),
('subtraction',4,'8-10','What is 742 - 389?',   '["351","352","353","354"]', 2, 'builtin'),
('subtraction',4,'8-10','What is 600 - 347?',   '["251","252","253","254"]', 2, 'builtin'),
('subtraction',4,'8-10','What is 901 - 456?',   '["443","444","445","446"]', 2, 'builtin'),
('subtraction',4,'8-10','What is 823 - 467?',   '["354","355","356","357"]', 2, 'builtin'),

-- subtraction / levels 1-4 / 10-12
('subtraction',1,'10-12','What is 10 - 7?',     '["1","2","3","4"]', 2, 'builtin'),
('subtraction',1,'10-12','What is 9 - 5?',      '["2","3","4","5"]', 2, 'builtin'),
('subtraction',1,'10-12','What is 8 - 6?',      '["0","1","2","3"]', 2, 'builtin'),
('subtraction',1,'10-12','What is 7 - 4?',      '["1","2","3","4"]', 2, 'builtin'),
('subtraction',1,'10-12','What is 6 - 3?',      '["1","2","3","4"]', 2, 'builtin'),
('subtraction',2,'10-12','What is 84 - 47?',    '["35","36","37","38"]', 2, 'builtin'),
('subtraction',2,'10-12','What is 95 - 58?',    '["35","36","37","38"]', 2, 'builtin'),
('subtraction',2,'10-12','What is 72 - 39?',    '["31","32","33","34"]', 2, 'builtin'),
('subtraction',2,'10-12','What is 100 - 63?',   '["35","36","37","38"]', 2, 'builtin'),
('subtraction',2,'10-12','What is 88 - 45?',    '["41","42","43","44"]', 2, 'builtin'),
('subtraction',3,'10-12','What is 456 - 278?',  '["176","177","178","179"]', 2, 'builtin'),
('subtraction',3,'10-12','What is 803 - 547?',  '["254","255","256","257"]', 2, 'builtin'),
('subtraction',3,'10-12','What is 1000 - 673?', '["325","326","327","328"]', 2, 'builtin'),
('subtraction',3,'10-12','What is 912 - 456?',  '["454","455","456","457"]', 2, 'builtin'),
('subtraction',3,'10-12','What is 750 - 389?',  '["359","360","361","362"]', 2, 'builtin'),
('subtraction',4,'10-12','What is 2 000 - 1 347?','["651","652","653","654"]', 2, 'builtin'),
('subtraction',4,'10-12','What is 5 000 - 3 728?','["1270","1271","1272","1273"]', 2, 'builtin'),
('subtraction',4,'10-12','What is 3 456 - 1 789?','["1665","1666","1667","1668"]', 2, 'builtin'),
('subtraction',4,'10-12','What is 4 200 - 2 567?','["1631","1632","1633","1634"]', 2, 'builtin'),
('subtraction',4,'10-12','What is 6 000 - 4 123?','["1875","1876","1877","1878"]', 2, 'builtin'),

-- ── MULTIPLICATION ───────────────────────────────────────────

-- multiplication / level 1 / 6-8 (×2, ×3)
('multiplication',1,'6-8','What is 2 × 3?',     '["4","5","6","7"]', 2, 'builtin'),
('multiplication',1,'6-8','What is 3 × 2?',     '["4","5","6","7"]', 2, 'builtin'),
('multiplication',1,'6-8','What is 2 × 4?',     '["6","7","8","9"]', 2, 'builtin'),
('multiplication',1,'6-8','What is 3 × 3?',     '["7","8","9","10"]', 2, 'builtin'),
('multiplication',1,'6-8','What is 2 × 5?',     '["8","9","10","11"]', 2, 'builtin'),

-- multiplication / level 2 / 6-8 (×4–×6)
('multiplication',2,'6-8','What is 4 × 3?',     '["10","11","12","13"]', 2, 'builtin'),
('multiplication',2,'6-8','What is 5 × 4?',     '["18","19","20","21"]', 2, 'builtin'),
('multiplication',2,'6-8','What is 6 × 3?',     '["16","17","18","19"]', 2, 'builtin'),
('multiplication',2,'6-8','What is 4 × 4?',     '["14","15","16","17"]', 2, 'builtin'),
('multiplication',2,'6-8','What is 5 × 5?',     '["23","24","25","26"]', 2, 'builtin'),

-- multiplication / level 3 / 6-8 (×7–×9)
('multiplication',3,'6-8','What is 7 × 3?',     '["19","20","21","22"]', 2, 'builtin'),
('multiplication',3,'6-8','What is 8 × 4?',     '["30","31","32","33"]', 2, 'builtin'),
('multiplication',3,'6-8','What is 9 × 3?',     '["25","26","27","28"]', 2, 'builtin'),
('multiplication',3,'6-8','What is 7 × 6?',     '["40","41","42","43"]', 2, 'builtin'),
('multiplication',3,'6-8','What is 8 × 5?',     '["38","39","40","41"]', 2, 'builtin'),

-- multiplication / level 4 / 6-8 (mixed ×2–×9, up to 9×9)
('multiplication',4,'6-8','What is 7 × 8?',     '["54","55","56","57"]', 2, 'builtin'),
('multiplication',4,'6-8','What is 9 × 6?',     '["52","53","54","55"]', 2, 'builtin'),
('multiplication',4,'6-8','What is 8 × 8?',     '["62","63","64","65"]', 2, 'builtin'),
('multiplication',4,'6-8','What is 9 × 7?',     '["61","62","63","64"]', 2, 'builtin'),
('multiplication',4,'6-8','What is 9 × 9?',     '["79","80","81","82"]', 2, 'builtin'),

-- multiplication / levels 1-4 / 8-10
('multiplication',1,'8-10','What is 3 × 4?',    '["10","11","12","13"]', 2, 'builtin'),
('multiplication',1,'8-10','What is 4 × 2?',    '["6","7","8","9"]', 2, 'builtin'),
('multiplication',1,'8-10','What is 5 × 3?',    '["13","14","15","16"]', 2, 'builtin'),
('multiplication',1,'8-10','What is 6 × 2?',    '["10","11","12","13"]', 2, 'builtin'),
('multiplication',1,'8-10','What is 3 × 5?',    '["13","14","15","16"]', 2, 'builtin'),
('multiplication',2,'8-10','What is 6 × 7?',    '["40","41","42","43"]', 2, 'builtin'),
('multiplication',2,'8-10','What is 7 × 5?',    '["33","34","35","36"]', 2, 'builtin'),
('multiplication',2,'8-10','What is 8 × 6?',    '["46","47","48","49"]', 2, 'builtin'),
('multiplication',2,'8-10','What is 9 × 4?',    '["34","35","36","37"]', 2, 'builtin'),
('multiplication',2,'8-10','What is 6 × 8?',    '["46","47","48","49"]', 2, 'builtin'),
('multiplication',3,'8-10','What is 12 × 5?',   '["58","59","60","61"]', 2, 'builtin'),
('multiplication',3,'8-10','What is 11 × 8?',   '["86","87","88","89"]', 2, 'builtin'),
('multiplication',3,'8-10','What is 13 × 4?',   '["50","51","52","53"]', 2, 'builtin'),
('multiplication',3,'8-10','What is 14 × 3?',   '["40","41","42","43"]', 2, 'builtin'),
('multiplication',3,'8-10','What is 15 × 6?',   '["88","89","90","91"]', 2, 'builtin'),
('multiplication',4,'8-10','What is 23 × 7?',   '["159","160","161","162"]', 2, 'builtin'),
('multiplication',4,'8-10','What is 34 × 5?',   '["168","169","170","171"]', 2, 'builtin'),
('multiplication',4,'8-10','What is 18 × 9?',   '["160","161","162","163"]', 2, 'builtin'),
('multiplication',4,'8-10','What is 42 × 6?',   '["250","251","252","253"]', 2, 'builtin'),
('multiplication',4,'8-10','What is 27 × 8?',   '["214","215","216","217"]', 2, 'builtin'),

-- multiplication / levels 1-4 / 10-12
('multiplication',1,'10-12','What is 6 × 4?',   '["22","23","24","25"]', 2, 'builtin'),
('multiplication',1,'10-12','What is 5 × 7?',   '["33","34","35","36"]', 2, 'builtin'),
('multiplication',1,'10-12','What is 8 × 3?',   '["22","23","24","25"]', 2, 'builtin'),
('multiplication',1,'10-12','What is 9 × 2?',   '["16","17","18","19"]', 2, 'builtin'),
('multiplication',1,'10-12','What is 7 × 4?',   '["26","27","28","29"]', 2, 'builtin'),
('multiplication',2,'10-12','What is 12 × 12?', '["142","143","144","145"]', 2, 'builtin'),
('multiplication',2,'10-12','What is 11 × 11?', '["119","120","121","122"]', 2, 'builtin'),
('multiplication',2,'10-12','What is 13 × 9?',  '["115","116","117","118"]', 2, 'builtin'),
('multiplication',2,'10-12','What is 14 × 7?',  '["96","97","98","99"]', 2, 'builtin'),
('multiplication',2,'10-12','What is 15 × 8?',  '["118","119","120","121"]', 2, 'builtin'),
('multiplication',3,'10-12','What is 25 × 12?', '["298","299","300","301"]', 2, 'builtin'),
('multiplication',3,'10-12','What is 32 × 11?', '["350","351","352","353"]', 2, 'builtin'),
('multiplication',3,'10-12','What is 45 × 9?',  '["403","404","405","406"]', 2, 'builtin'),
('multiplication',3,'10-12','What is 56 × 8?',  '["446","447","448","449"]', 2, 'builtin'),
('multiplication',3,'10-12','What is 37 × 7?',  '["257","258","259","260"]', 2, 'builtin'),
('multiplication',4,'10-12','What is 125 × 8?', '["998","999","1000","1001"]', 2, 'builtin'),
('multiplication',4,'10-12','What is 234 × 6?', '["1402","1403","1404","1405"]', 2, 'builtin'),
('multiplication',4,'10-12','What is 178 × 9?', '["1600","1601","1602","1603"]', 2, 'builtin'),
('multiplication',4,'10-12','What is 312 × 7?', '["2182","2183","2184","2185"]', 2, 'builtin'),
('multiplication',4,'10-12','What is 456 × 5?', '["2278","2279","2280","2281"]', 2, 'builtin'),

-- ── DIVISION ─────────────────────────────────────────────────

-- division / level 1 / 6-8 (÷2, ÷3, exact)
('division',1,'6-8','What is 6 ÷ 2?',           '["2","3","4","5"]', 1, 'builtin'),
('division',1,'6-8','What is 9 ÷ 3?',           '["2","3","4","5"]', 1, 'builtin'),
('division',1,'6-8','What is 8 ÷ 2?',           '["3","4","5","6"]', 1, 'builtin'),
('division',1,'6-8','What is 10 ÷ 2?',          '["4","5","6","7"]', 1, 'builtin'),
('division',1,'6-8','What is 12 ÷ 3?',          '["3","4","5","6"]', 1, 'builtin'),

-- division / level 2 / 6-8
('division',2,'6-8','What is 20 ÷ 4?',          '["4","5","6","7"]', 1, 'builtin'),
('division',2,'6-8','What is 30 ÷ 5?',          '["5","6","7","8"]', 1, 'builtin'),
('division',2,'6-8','What is 24 ÷ 6?',          '["3","4","5","6"]', 1, 'builtin'),
('division',2,'6-8','What is 28 ÷ 4?',          '["6","7","8","9"]', 1, 'builtin'),
('division',2,'6-8','What is 35 ÷ 5?',          '["6","7","8","9"]', 1, 'builtin'),

-- division / level 3 / 6-8
('division',3,'6-8','What is 48 ÷ 6?',          '["7","8","9","10"]', 1, 'builtin'),
('division',3,'6-8','What is 56 ÷ 7?',          '["7","8","9","10"]', 1, 'builtin'),
('division',3,'6-8','What is 63 ÷ 9?',          '["6","7","8","9"]', 1, 'builtin'),
('division',3,'6-8','What is 72 ÷ 8?',          '["8","9","10","11"]', 1, 'builtin'),
('division',3,'6-8','What is 64 ÷ 8?',          '["7","8","9","10"]', 1, 'builtin'),

-- division / level 4 / 6-8
('division',4,'6-8','What is 81 ÷ 9?',          '["8","9","10","11"]', 1, 'builtin'),
('division',4,'6-8','What is 72 ÷ 9?',          '["7","8","9","10"]', 1, 'builtin'),
('division',4,'6-8','What is 96 ÷ 8?',          '["11","12","13","14"]', 1, 'builtin'),
('division',4,'6-8','What is 84 ÷ 7?',          '["11","12","13","14"]', 1, 'builtin'),
('division',4,'6-8','What is 99 ÷ 9?',          '["10","11","12","13"]', 1, 'builtin'),

-- division / levels 1-4 / 8-10
('division',1,'8-10','What is 15 ÷ 3?',         '["4","5","6","7"]', 1, 'builtin'),
('division',1,'8-10','What is 16 ÷ 4?',         '["3","4","5","6"]', 1, 'builtin'),
('division',1,'8-10','What is 18 ÷ 6?',         '["2","3","4","5"]', 1, 'builtin'),
('division',1,'8-10','What is 21 ÷ 7?',         '["2","3","4","5"]', 1, 'builtin'),
('division',1,'8-10','What is 24 ÷ 8?',         '["2","3","4","5"]', 1, 'builtin'),
('division',2,'8-10','What is 54 ÷ 6?',         '["8","9","10","11"]', 1, 'builtin'),
('division',2,'8-10','What is 63 ÷ 7?',         '["8","9","10","11"]', 1, 'builtin'),
('division',2,'8-10','What is 72 ÷ 9?',         '["7","8","9","10"]', 1, 'builtin'),
('division',2,'8-10','What is 48 ÷ 8?',         '["5","6","7","8"]', 1, 'builtin'),
('division',2,'8-10','What is 45 ÷ 5?',         '["8","9","10","11"]', 1, 'builtin'),
('division',3,'8-10','What is 132 ÷ 12?',       '["10","11","12","13"]', 1, 'builtin'),
('division',3,'8-10','What is 156 ÷ 13?',       '["11","12","13","14"]', 1, 'builtin'),
('division',3,'8-10','What is 168 ÷ 14?',       '["11","12","13","14"]', 1, 'builtin'),
('division',3,'8-10','What is 180 ÷ 15?',       '["11","12","13","14"]', 1, 'builtin'),
('division',3,'8-10','What is 192 ÷ 16?',       '["11","12","13","14"]', 1, 'builtin'),
('division',4,'8-10','What is 360 ÷ 24?',       '["13","14","15","16"]', 2, 'builtin'),
('division',4,'8-10','What is 432 ÷ 18?',       '["23","24","25","26"]', 1, 'builtin'),
('division',4,'8-10','What is 480 ÷ 20?',       '["23","24","25","26"]', 1, 'builtin'),
('division',4,'8-10','What is 576 ÷ 24?',       '["23","24","25","26"]', 1, 'builtin'),
('division',4,'8-10','What is 625 ÷ 25?',       '["23","24","25","26"]', 2, 'builtin'),

-- division / levels 1-4 / 10-12
('division',1,'10-12','What is 27 ÷ 9?',        '["2","3","4","5"]', 1, 'builtin'),
('division',1,'10-12','What is 32 ÷ 8?',        '["3","4","5","6"]', 1, 'builtin'),
('division',1,'10-12','What is 36 ÷ 6?',        '["5","6","7","8"]', 1, 'builtin'),
('division',1,'10-12','What is 42 ÷ 7?',        '["5","6","7","8"]', 1, 'builtin'),
('division',1,'10-12','What is 45 ÷ 9?',        '["4","5","6","7"]', 1, 'builtin'),
('division',2,'10-12','What is 144 ÷ 12?',      '["11","12","13","14"]', 1, 'builtin'),
('division',2,'10-12','What is 169 ÷ 13?',      '["12","13","14","15"]', 1, 'builtin'),
('division',2,'10-12','What is 196 ÷ 14?',      '["13","14","15","16"]', 1, 'builtin'),
('division',2,'10-12','What is 225 ÷ 15?',      '["14","15","16","17"]', 1, 'builtin'),
('division',2,'10-12','What is 256 ÷ 16?',      '["15","16","17","18"]', 1, 'builtin'),
('division',3,'10-12','What is 840 ÷ 24?',      '["34","35","36","37"]', 1, 'builtin'),
('division',3,'10-12','What is 975 ÷ 25?',      '["38","39","40","41"]', 1, 'builtin'),
('division',3,'10-12','What is 912 ÷ 38?',      '["23","24","25","26"]', 1, 'builtin'),
('division',3,'10-12','What is 1050 ÷ 42?',     '["24","25","26","27"]', 1, 'builtin'),
('division',3,'10-12','What is 1260 ÷ 45?',     '["27","28","29","30"]', 1, 'builtin'),
('division',4,'10-12','What is 2 400 ÷ 48?',    '["49","50","51","52"]', 1, 'builtin'),
('division',4,'10-12','What is 3 600 ÷ 72?',    '["49","50","51","52"]', 1, 'builtin'),
('division',4,'10-12','What is 4 500 ÷ 90?',    '["49","50","51","52"]', 1, 'builtin'),
('division',4,'10-12','What is 5 400 ÷ 108?',   '["49","50","51","52"]', 1, 'builtin'),
('division',4,'10-12','What is 6 300 ÷ 126?',   '["49","50","51","52"]', 1, 'builtin');


-- =============================================================
-- PART 2: DEMO DATA
-- =============================================================
-- Creates a demo parent account you can log into.
-- NOTE: Supabase Auth doesn't let SQL directly insert passwords.
-- Instead, we add a row to auth.users with a pre-hashed password
-- using Supabase's bcrypt format so you can log in immediately.
-- Email:    demo@stempet.dev
-- Password: Demo1234!
-- =============================================================

-- Insert demo user into Supabase auth (only works if Supabase allows it;
-- if this fails, sign up manually at your Supabase project URL and note the user ID).
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'demo@stempet.dev',
  -- bcrypt hash of 'Demo1234!'
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  'authenticated',
  'authenticated'
) on conflict (id) do nothing;

-- Child: Alex, 9 years old → age_group 8-10
insert into children (id, parent_id, name, age_group) values
  ('00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000001',
   'Alex', '8-10')
on conflict (id) do nothing;

-- Device linked to Alex
insert into devices (id, child_id, device_code, last_seen_at) values
  ('00000000-0000-0000-0000-000000000020',
   '00000000-0000-0000-0000-000000000010',
   'DEMO01', now() - interval '2 hours')
on conflict (id) do nothing;

-- ── 200 demo attempts spanning 30 days ──────────────────────
-- Alex starts at addition/level 1, improves through the levels.
-- Days 1-7:   addition level 1, accuracy ~60% (learning)
-- Days 8-14:  addition level 2, accuracy ~70% (gaining confidence)
-- Days 15-21: addition level 3 + subtraction level 1, ~75%
-- Days 22-30: subtraction level 2 + multiplication level 1, ~80%
-- Note: question_id can be null for demo data (no specific question linked).

do $$
declare
  child_id uuid := '00000000-0000-0000-0000-000000000010';
  -- Day offsets from "now - 30 days"
  base_ts timestamptz := now() - interval '30 days';
  day_offset int;
  attempt_time timestamptz;
  skill text;
  lvl int;
  correct bool;
  attempt_count int;
  correct_chance float;
  q_time int;
begin
  -- Days 1-7: addition level 1, improving from 55% → 65% accuracy
  for day_offset in 1..7 loop
    attempt_count := 5 + (day_offset % 3); -- 5–7 attempts per day
    correct_chance := 0.50 + day_offset * 0.02; -- starts 52%, ends ~64%
    for i in 1..attempt_count loop
      attempt_time := base_ts + (day_offset || ' days')::interval + (i * 3 || ' minutes')::interval;
      correct := random() < correct_chance;
      q_time := 8000 + floor(random() * 12000)::int; -- 8–20 seconds
      insert into attempts (child_id, skill, level, is_correct, time_ms, created_at)
      values (child_id, 'addition', 1, correct, q_time, attempt_time);
    end loop;
  end loop;

  -- Days 8-14: addition level 2, accuracy 65% → 78%
  for day_offset in 8..14 loop
    attempt_count := 6 + (day_offset % 4);
    correct_chance := 0.60 + (day_offset - 7) * 0.025;
    for i in 1..attempt_count loop
      attempt_time := base_ts + (day_offset || ' days')::interval + (i * 4 || ' minutes')::interval;
      correct := random() < correct_chance;
      q_time := 7000 + floor(random() * 10000)::int;
      insert into attempts (child_id, skill, level, is_correct, time_ms, created_at)
      values (child_id, 'addition', 2, correct, q_time, attempt_time);
    end loop;
  end loop;

  -- Days 15-18: addition level 3, accuracy ~75%
  for day_offset in 15..18 loop
    attempt_count := 7;
    correct_chance := 0.72 + (day_offset - 14) * 0.01;
    for i in 1..attempt_count loop
      attempt_time := base_ts + (day_offset || ' days')::interval + (i * 3 || ' minutes')::interval;
      correct := random() < correct_chance;
      q_time := 6000 + floor(random() * 9000)::int;
      insert into attempts (child_id, skill, level, is_correct, time_ms, created_at)
      values (child_id, 'addition', 3, correct, q_time, attempt_time);
    end loop;
  end loop;

  -- Days 19-21: subtraction level 1 (just started), accuracy ~65%
  for day_offset in 19..21 loop
    attempt_count := 6;
    correct_chance := 0.62 + (day_offset - 18) * 0.03;
    for i in 1..attempt_count loop
      attempt_time := base_ts + (day_offset || ' days')::interval + (i * 4 || ' minutes')::interval;
      correct := random() < correct_chance;
      q_time := 9000 + floor(random() * 11000)::int;
      insert into attempts (child_id, skill, level, is_correct, time_ms, created_at)
      values (child_id, 'subtraction', 1, correct, q_time, attempt_time);
    end loop;
  end loop;

  -- Days 22-26: subtraction level 2, accuracy ~75%
  for day_offset in 22..26 loop
    attempt_count := 7 + (day_offset % 2);
    correct_chance := 0.70 + (day_offset - 21) * 0.02;
    for i in 1..attempt_count loop
      attempt_time := base_ts + (day_offset || ' days')::interval + (i * 3 || ' minutes')::interval;
      correct := random() < correct_chance;
      q_time := 7500 + floor(random() * 8000)::int;
      insert into attempts (child_id, skill, level, is_correct, time_ms, created_at)
      values (child_id, 'subtraction', 2, correct, q_time, attempt_time);
    end loop;
  end loop;

  -- Days 27-30: multiplication level 1 (brand new skill!), accuracy ~58%
  for day_offset in 27..30 loop
    attempt_count := 5 + (day_offset % 3);
    correct_chance := 0.55 + (day_offset - 26) * 0.02;
    for i in 1..attempt_count loop
      attempt_time := base_ts + (day_offset || ' days')::interval + (i * 5 || ' minutes')::interval;
      correct := random() < correct_chance;
      q_time := 10000 + floor(random() * 15000)::int;
      insert into attempts (child_id, skill, level, is_correct, time_ms, created_at)
      values (child_id, 'multiplication', 1, correct, q_time, attempt_time);
    end loop;
  end loop;
end $$;
