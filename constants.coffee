_ = require "lodash"

exports.behaviourType =
	800:  "zBEH_CLOUD"					# cloud (moving)
	900:  "zBEH_SIMPLE_DOOR_LEFT"		# door left (simple, unlocked)
	901:  "zBEH_SIMPLE_DOOR_RIGHT"		# door right (simple, unlocked)
	902:  "zBEH_METAL_DOOR_LEFT"		# metal door left (unlocked)
	903:  "zBEH_CITY_DOOR_DOWN"			# City Door down
	904:  "zBEH_CITY_DOOR_UP" 			# City Door up
	910:  "zBEH_DOOR_GOLD"				# door gold
	911:  "zBEH_DOOR_SILVER"			# door silver
	912:  "zBEH_DOOR_COPPER"			# door copper
	913:  "zBEH_DOOR_BRONZE" 			# door bronze
	914:  "zBEH_DOOR_IRON" 				# door iron
	915:  "zBEH_DOOR_PLATING" 			# door platin
	916:  "zBEH_DOOR_GLASS" 			# door glass
	917:  "zBEH_DOOR_WITHLOCK" 			# door with lock
	918:  "zBEH_CITY_DOOR_LOCK" 		# S* City Door lock
	919:  "zBEH_LOCKED_METAL_DOOR" 		# locked metal door
	920:  "zBEH_LOCKED_WOODEN_DOOR" 	# locked wood door
	921:  "zBEH_DOOR_RED"				# red door
	922:  "zBEH_DOOR_YELLOW"			# yellow door
	923:  "zBEH_DOOR_BLUE"				# blue door
	1000: "zBEH_COLLECTABLE" 			# collectable
	1001: "zBEH_COLLECTABLE_EFF0" 		# collectable effect0
	1002: "zBEH_COLLECTABLE_EFF0" 		# collectable effect1
	1100: "zBEH_LOCK" 					# lock
	1500: "zBEH_BLOCKER_STONE" 			# blocker stone
	1501: "zBEH_BLOCKER_PLANT" 			# blocker plant
	1502: "zBEH_MAGIC_BRIDGE_STATIC" 	# magic brige static
	1503: "zBEH_IRON_GATE" 				# iron gate
	1504: "zBEH_MAGIC_BRIDGE_0" 		# magic brige 0
	1505: "zBEH_MAGIC_BRIDGE_1" 		# magic brige 1
	1506: "zBEH_MAGIC_BRIDGE_2" 		# magic brige 2
	2000: "zBEH_2000" # look at player
	2001: "zBEH_2001" # swing
	2002: "zBEH_FLAME_ANIMATION" # flame animation
	2003: "zBEH_2003" # skymovement(river1)
	2004: "zBEH_2004" # river speed 2
	2005: "zBEH_2005" # river speed 3
	2006: "zBEH_2006" # river speed 4
	2007: "zBEH_2007" # water animation
	2008: "zBEH_2008" # Y-Rotate 1
	2009: "zBEH_2009" # Y-Rotate 2
	2010: "zBEH_2010" # bird
	2011: "zBEH_TEXTURE_WOBBLE"		# texturewobble (obselete)
	2012: "zBEH_2012" # simple corona
	2013: "zBEH_2013" # bird - circle
	2014: "zBEH_2014" # Z-Rotate 1
	2015: "zBEH_2015" # Z-Rotate 2
	2016: "zBEH_2016" # X-Rotate 1
	2017: "zBEH_2017" # X-Rotate 2
	2018: "zBEH_2018" # river speed 5
	2019: "zBEH_2019" # river speed 6
	2020: "zBEH_2020" # river speed 7
	2021: "zBEH_2021" # river speed 8
	2100: "zBEH_2100" # fly away (visible)
	2101: "zBEH_2101" # fly away (invisible)
	2102: "zBEH_2102" # fly away (straight)
exports.behaviourTypeInverse = _.invert exports.behaviourType

exports.lightType =
	1: "lUNKNOWN1"
	128: "lUNKNOWN128"
	129: "lUNKNOWN129"
exports.lightTypeInverse = _.invert exports.lightType


exports.triggerType = 
	0: "trUNKNOWN1"
	1: "trUNKNOWN2"
	2: "trUNKNOWN3"
exports.triggerTypeInverse = _.invert exports.triggerType


exports.effectType2 = 
	1: "ef2UNKNOWN1"
	6: "ef2UNKNOWN6"
	10: "ef2UNKNOWN10"
	11: "ef2SNOWFLAKES"
	13: "ef2UNKNOWN5"
exports.effectType2Inverse = _.invert exports.effectType2

### Item codes:
item 1 - Средний напиток лечения
item 2 - Большой напиток лечения
item 3 - Лечащие травы
item 4 - Монеты фей
item 5 - Тестовый амулет
item 6 - Кристалл
item 7 - Лекарство
item 8 - Рог фей
item 9 - Амулет опыта
item 10 - Лист клевера
item 11 - Тестовый амулет
item 12 - Зарезервированная магическая карта
item 13 - Золотая морковь
item 14 - Зарезервированная магическая карта
item 15 - Океанский моллюск
item 16 - Сумка эльфов
item 17 - Серебряная сфера
item 18 - Золотая сфера
item 19 - Кристаллическая сфера
item 20 - Чесночный атомайзер
item 21 - Ключ катакомб
item 22 - Тяжелый железный ключ
item 24 - Ключ стража эльфов
item 25 - Ключ от фабрики гномов
item 26 - Посох власти Клинвина
item 27 - Ключ к городскому залу
item 28 - Руна возврата
item 29 - Руна сада фей
item 30 - Руна Тиралина
item 31 - Руна Данмора
item 32 - Руна башни гномов
item 33 - Руна пещерного мира
item 34 - Руна ледяного мира
item 35 - Руна облачного измирения
item 36 - Руна измирения теней
item 37 - Руна коттеджа
item 38 - Лесная руна II
item 39 - Болотная руна II
item 40 - Горная руна II
item 41 - Пещерная руна II
item 42 - Небесная руна II
item 43 - Темная руна II
item 44 - Карта фей воздуха
item 45 - Карта фей земли
item 46 - Карта фей огня
item 47 - Карта фей природы
item 48 - Карта пси-фей
item 49 - Зарезервированная магическая карта
item 50 - Зарезервированная магическая карта
item 51 - Эволюционная магия воздуха
item 52 - Эволюционная магия огня
item 53 - Эволюционная магия природы
item 54 - Природный ключ огня
item 55 - Природный ключ воздуха
item 56 - Природный ключ стихий
item 57 - Природный ключ земли
item 58 - Книга фей
item 59 - Сумка фей
item 60 - Напиток маны
item 61 - Магия плесени
item 62 - Карта сада фей
item 63 - Карта зачарованого леса
item 64 - Карта горного мира
item 65 - Карта темного болота
item 66 - Карта измирения теней
item 67 - Карта облачного измирения
item 68 - Карта темного болота
item 69 - Карта горного мира
item 70 - Карта зачарованого леса
item 71 - Красный костяной ключ
item 72 - Зеленый костяной ключ
item 73 - Синий костяной ключ
###

### Wizform codes:
wizform 1 - Витерия
wizform 2 - Бонерия
wizform 3 - Грем
wizform 4 - Гремор
wizform 5 - Гремрок
wizform 6 - Тадана
wizform 7 - Аквана
wizform 8 - Океана
wizform 9 - Воргот
wizform 10 - Горгот
wizform 11 - Симгот
wizform 12 - Эйрия
wizform 13 - Лурия
wizform 14 - Летиция
wizform 15 - Разроу
wizform 16 - Малроу
wizform 17 - Псироу
wizform 18 - Эбери
wizform 19 - Абнобери
wizform 20 - Весбат
wizform 21 - Стобат
wizform 22 - Гарбат
wizform 23 - Кера
wizform 24 - Амнис
wizform 25 - Керамнис
wizform 26 - Блюмелла
wizform 27 - Менкр
wizform 28 - Меник
wizform 29 - Виолектра
wizform 30 - Биолектра
wizform 31 - Пикс
wizform 32 - Ферикс
wizform 33 - Демоникс
wizform 34 - Физ
wizform 35 - Гриз
wizform 36 - Гризлок
wizform 37 - Скелбо
wizform 38 - СкелДжоу
wizform 39 - Скелрат
wizform 40 - Сираэль
wizform 41 - Гораэль
wizform 42 - Фатраэль
wizform 43 - Дарбуй
wizform 44 - Буй
wizform 45 - Лайбуй
wizform 46 - Бельтаур
wizform 47 - Ментавр
wizform 48 - Клам
wizform 49 - Клумар
wizform 50 - Пфо
wizform 51 - Тэйэ
wizform 52 - Глэсисс
wizform 53 - Акритар
wizform 54 - Сирелла
wizform 55 - Драквин
wizform 56 - Флагвин
wizform 57 - Тайнфол
wizform 58 - Тайнгрог
wizform 59 - Тинзард
wizform 60 - Тайнвес
wizform 61 - Фигаэри
wizform 62 - ДжумДжум
wizform 63 - Джамрок
wizform 64 - Простофиля
wizform 65 - Минари
wizform 66 - Мегари
wizform 67 - Гигарекс
wizform 68 - Сегбазз
wizform 69 - Манокс
wizform 70 - Тернокс
wizform 71 - Дреданокс
wizform 72 - Лигейн
wizform 73 - Дриана
wizform 74 - Суанна
wizform 75 - Лана
wizform 76 - Лиана
###
