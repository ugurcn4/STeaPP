import { getFirebaseDb } from '../../firebaseConfig';
import { collection, doc, setDoc } from 'firebase/firestore';

const cityData = {
    istanbul: {
        id: 'istanbul',
        name: 'İstanbul',
        region: 'marmara',
        imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80',
        activities: [
            {
                id: 'balik-ekmek',
                name: 'Balık-Ekmek Ustası',
                description: 'Eminönü\'nde balık-ekmek ye, martılarla pazarlık yap 😄',
                points: 100,
                duration: '30 dakika',
                type: 'food'
            },
            {
                id: 'kapali-carsi',
                name: 'Pazarlık Kralı',
                description: 'Kapalıçarşı\'da bir halıcıyla pazarlık et (almasan da olur) 😅',
                points: 150,
                duration: '1 saat',
                type: 'shopping'
            },
            {
                id: 'kiz-kulesi',
                name: 'Aşıklar Tepesi',
                description: 'Kız Kulesi\'ne karşı çay iç, İstanbul\'u izle (sevgili opsiyonel) 💑',
                points: 120,
                duration: '2 saat',
                type: 'sightseeing'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Çaylak Gezgin',
                description: '3 aktivite tamamla, trafiğe alış!'
            },
            silver: {
                icon: '🥈',
                name: 'Boğaz Fatihi',
                description: '5 aktivite tamamla, artık vapur kaptanı oldun!'
            },
            gold: {
                icon: '🥇',
                name: 'İstanbul Efendisi',
                description: 'Tüm aktiviteleri tamamla, simit satmaya başla!'
            }
        }
    },
    izmir: {
        id: 'izmir',
        name: 'İzmir',
        region: 'ege',
        imageUrl: 'https://images.unsplash.com/photo-1589030343991-69ea1433b941?w=800&q=80',
        activities: [
            {
                id: 'boyoz',
                name: 'Sabah Sporcusu',
                description: 'Kordon\'da boyoz ye, gavur şehrinin tadını çıkar 🥐',
                points: 100,
                duration: '30 dakika',
                type: 'food'
            },
            {
                id: 'kumru',
                name: 'Kumru Avcısı',
                description: 'Çeşme\'de kumru ye, sosunu gömleğine damlatmadan bitir! 🥪',
                points: 120,
                duration: '45 dakika',
                type: 'food'
            },
            {
                id: 'asansor',
                name: 'Yükseklik Ustası',
                description: 'Asansör\'de gün batımını izle, romantikliğin dibine vur 🌅',
                points: 150,
                duration: '2 saat',
                type: 'sightseeing'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Çiçek Çocuğu',
                description: '3 aktivite tamamla, efelerin yolunda!'
            },
            silver: {
                icon: '🥈',
                name: 'Kordon Kahramanı',
                description: '5 aktivite tamamla, artık sen de 35.5\'sın!'
            },
            gold: {
                icon: '🥇',
                name: 'İzmir Efesi',
                description: 'Tüm aktiviteleri tamamla, boyoz hamurunu açmaya başla!'
            }
        }
    },
    ankara: {
        id: 'ankara',
        name: 'Ankara',
        region: 'ic_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1589030343991-69ea1433b941?w=800&q=80',
        activities: [
            {
                id: 'simit-doner',
                name: 'Kızılay Gezgini',
                description: 'Simit Sarayı\'nda döner ye, memur kardeşlerinle kaynaş 🥯',
                points: 100,
                duration: '45 dakika',
                type: 'food'
            },
            {
                id: 'ulus-manzara',
                name: 'Şehir Kaşifi',
                description: 'Ankara Kalesi\'nden şehri izle, başkentin havasını solu 🏰',
                points: 130,
                duration: '2 saat',
                type: 'sightseeing'
            },
            {
                id: 'cig-kofte',
                name: 'Acı Sever',
                description: 'Çiğköfte ye, gözlerinden yaş gelene kadar devam et! 🌶️',
                points: 120,
                duration: '30 dakika',
                type: 'food'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Memur Adayı',
                description: '3 aktivite tamamla, devlet dairesine alış!'
            },
            silver: {
                icon: '🥈',
                name: 'Başkent Sevdalısı',
                description: '5 aktivite tamamla, artık tam bir bürokrat oldun!'
            },
            gold: {
                icon: '🥇',
                name: 'Ankara\'nın Bülbülü',
                description: 'Tüm aktiviteleri tamamla, dilekçe yazmaya başla!'
            }
        }
    },
    bursa: {
        id: 'bursa',
        name: 'Bursa',
        region: 'marmara',
        imageUrl: 'https://images.unsplash.com/photo-1558699718-2d3df5a677a7?w=800&q=80',
        activities: [
            {
                id: 'iskender',
                name: 'İskender Savaşçısı',
                description: 'Tarihi Kebapçı\'da İskender ye, tereyağını da koy koy koy! 🥩',
                points: 100,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'uludag',
                name: 'Kar Kralı',
                description: 'Uludağ\'da kayak yap (veya sadece kartopu at, o da sayılır) ⛷️',
                points: 150,
                duration: '4 saat',
                type: 'activity'
            },
            {
                id: 'koza-han',
                name: 'İpek Böceği',
                description: 'Koza Han\'da dibek kahvesi iç, osmanlı torunu olduğunu hatırla 🏰',
                points: 120,
                duration: '1 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Yeşil Acemi',
                description: '3 aktivite tamamla, şehrin yeşiline alış!'
            },
            silver: {
                icon: '🥈',
                name: 'İpek Ustası',
                description: '5 aktivite tamamla, artık gerçek bir Bursalısın!'
            },
            gold: {
                icon: '🥇',
                name: 'Osmanlı Sultanı',
                description: 'Tüm aktiviteleri tamamla, kestane şekeri dağıtmaya başla!'
            }
        }
    },
    antalya: {
        id: 'antalya',
        name: 'Antalya',
        region: 'akdeniz',
        imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&q=80',
        activities: [
            {
                id: 'kunefe',
                name: 'Tatlı Canavarı',
                description: 'Kaleiçi\'nde künefe ye, peynirini uzat uzaaaaat 🧀',
                points: 100,
                duration: '45 dakika',
                type: 'food'
            },
            {
                id: 'konyaalti',
                name: 'Plaj Filozofu',
                description: 'Konyaaltı\'nda güneşlen, Alman turistlerle yarış 🏖️',
                points: 130,
                duration: '3 saat',
                type: 'activity'
            },
            {
                id: 'duden',
                name: 'Su Perisi',
                description: 'Düden Şelalesi\'nde selfie çek, ıslanmadan başarman imkansız! 💦',
                points: 120,
                duration: '2 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Turist Rehberi',
                description: '3 aktivite tamamla, güneş yanığına hazır ol!'
            },
            silver: {
                icon: '🥈',
                name: 'Sahil Bekçisi',
                description: '5 aktivite tamamla, artık gerçek bir Akdenizlisin!'
            },
            gold: {
                icon: '🥇',
                name: 'Portakal Çiçeği',
                description: 'Tüm aktiviteleri tamamla, turist tercümanlığına başla!'
            }
        }
    },
    trabzon: {
        id: 'trabzon',
        name: 'Trabzon',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'aksamit',
                name: 'Hamsi Kralı',
                description: 'Akçaabat köftesi ye, yanında hamsi olmazsa olmaz uşağum! 🐟',
                points: 110,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'sumela',
                name: 'Bulut Avcısı',
                description: 'Sümela Manastırı\'na tırman, bulutların üstüne çık da görek! 🏔️',
                points: 150,
                duration: '4 saat',
                type: 'historical'
            },
            {
                id: 'boztepe',
                name: 'Çay Tiryakisi',
                description: 'Boztepe\'de 7 bardak çay iç, 6\'da bırakanı almazlar! ☕',
                points: 120,
                duration: '2 saat',
                type: 'activity'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Hamsi Çırağı',
                description: '3 aktivite tamamla, yağmura alışmaya başla!'
            },
            silver: {
                icon: '🥈',
                name: 'Horon Ustası',
                description: '5 aktivite tamamla, kemençeyi duyunca ayakların oynasın!'
            },
            gold: {
                icon: '🥇',
                name: 'Karadeniz Fırtınası',
                description: 'Tüm aktiviteleri tamamla, mısır ekmeği yapmaya başla!'
            }
        }
    },
    gaziantep: {
        id: 'gaziantep',
        name: 'Gaziantep',
        region: 'guneydogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'baklava',
                name: 'Baklava Gurusu',
                description: 'Antep baklavası ye, "kaç kat bu?" diye sayma! 🍯',
                points: 140,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'kale',
                name: 'Kale Fatihi',
                description: 'Gaziantep Kalesi\'nde savaş müzesini gez, "top nerede?" deme! 🏰',
                points: 150,
                duration: '3 saat',
                type: 'historical'
            },
            {
                id: 'beyran',
                name: 'Beyran Kahramanı',
                description: 'Sabah beyranı iç, "bu çorba değil mi?" diyenlere ders ver! 🥣',
                points: 130,
                duration: '1 saat',
                type: 'food'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Fıstık Çırağı',
                description: '3 aktivite tamamla, fıstığı kavur!'
            },
            silver: {
                icon: '🥈',
                name: 'Baklavacı Ustası',
                description: '5 aktivite tamamla, şerbeti dök!'
            },
            gold: {
                icon: '🥇',
                name: 'Antep Beyi',
                description: 'Tüm aktiviteleri tamamla, baklava dükkanı aç!'
            }
        }
    },
    kilis: {
        id: 'kilis',
        name: 'Kilis',
        region: 'guneydogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'zeytin',
                name: 'Zeytin Ustası',
                description: 'Kilis zeytinyağı tadımı yap, "bu sıvı altın mı?" de! 🫒',
                points: 120,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'kartal',
                name: 'Kale Bekçisi',
                description: 'Kartal Kalesi\'ne tırman, "kuş yuvası mı bu?" deme! 🦅',
                points: 150,
                duration: '3 saat',
                type: 'historical'
            },
            {
                id: 'tava',
                name: 'Tava Filozofu',
                description: 'Kilis tava ye, "bu tavada ne var?" diye sorma! 🍳',
                points: 130,
                duration: '2 saat',
                type: 'food'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Zeytin Çırağı',
                description: '3 aktivite tamamla, hasada başla!'
            },
            silver: {
                icon: '🥈',
                name: 'Sabun Ustası',
                description: '5 aktivite tamamla, zeytinyağını işle!'
            },
            gold: {
                icon: '🥇',
                name: 'Kilis Beyi',
                description: 'Tüm aktiviteleri tamamla, zeytinlik kur!'
            }
        }
    },
    osmaniye: {
        id: 'osmaniye',
        name: 'Osmaniye',
        region: 'akdeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'yerfistigi',
                name: 'Fıstık Dedektifi',
                description: 'Yer fıstığı tarlasında fotoğraf çek, "bunlar neden yeraltında?" diye sor! 🥜',
                points: 140,
                duration: '2 saat',
                type: 'nature'
            },
            {
                id: 'karatepe',
                name: 'Hitit Avcısı',
                description: 'Karatepe-Aslantaş\'ta Hitit yazıtlarını oku, şifre çözme! 🏛️',
                points: 160,
                duration: '4 saat',
                type: 'historical'
            },
            {
                id: 'zorkun',
                name: 'Yayla Gezgini',
                description: 'Zorkun Yaylası\'nda mangal yap, dumanı takip etme! 🏕️',
                points: 130,
                duration: '3 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Fıstık Çırağı',
                description: '3 aktivite tamamla, toprağı kaz!'
            },
            silver: {
                icon: '🥈',
                name: 'Yayla Sevdalısı',
                description: '5 aktivite tamamla, yaylaya yerleş!'
            },
            gold: {
                icon: '🥇',
                name: 'Osmaniye Beyi',
                description: 'Tüm aktiviteleri tamamla, fıstık fabrikası kur!'
            }
        }
    },
    eskisehir: {
        id: 'eskisehir',
        name: 'Eskişehir',
        region: 'ic_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'ciborek',
                name: 'Çibörek Avcısı',
                description: 'Çibörek ye, Tatar ninelerin gözüne gir 🥟',
                points: 100,
                duration: '45 dakika',
                type: 'food'
            },
            {
                id: 'porsuk',
                name: 'Gondol Kaptanı',
                description: 'Porsuk\'ta gondola bin, Venedik\'te miyim diye şaşır 🚣',
                points: 120,
                duration: '1 saat',
                type: 'activity'
            },
            {
                id: 'odunpazari',
                name: 'Renkli Gezgin',
                description: 'Odunpazarı\'nda story çek, filtre kullanmana gerek yok! 🏠',
                points: 130,
                duration: '2 saat',
                type: 'sightseeing'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Öğrenci Adayı',
                description: '3 aktivite tamamla, kampüs havasına gir!'
            },
            silver: {
                icon: '🥈',
                name: 'Bisiklet Ustası',
                description: '5 aktivite tamamla, artık gerçek bir Eskişehirli oldun!'
            },
            gold: {
                icon: '🥇',
                name: 'Şehir Efsanesi',
                description: 'Tüm aktiviteleri tamamla, lületaşı ustası ol!'
            }
        }
    },
    kapadokya: {
        id: 'kapadokya',
        name: 'Kapadokya',
        region: 'ic_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'balon',
                name: 'Sabah Kuşu',
                description: 'Balon turuna katıl, uyku sevdasını bırak artık! 🎈',
                points: 200,
                duration: '3 saat',
                type: 'activity'
            },
            {
                id: 'atv',
                name: 'Vadi Kâşifi',
                description: 'ATV ile Kızıl Vadi\'yi keşfet, toz olmadan dönme! 🏍️',
                points: 150,
                duration: '2 saat',
                type: 'adventure'
            },
            {
                id: 'yeraltı',
                name: 'Yeraltı Kaşifi',
                description: 'Yeraltı şehrinde kaybol, çıkış yolunu bul (harita serbest) 🕯️',
                points: 130,
                duration: '1.5 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Peri Bacası',
                description: '3 aktivite tamamla, taşların dilini öğren!'
            },
            silver: {
                icon: '🥈',
                name: 'Vadi Gezgini',
                description: '5 aktivite tamamla, artık gerçek bir mağara insanısın!'
            },
            gold: {
                icon: '🥇',
                name: 'Kapadokya Sultanı',
                description: 'Tüm aktiviteleri tamamla, kendi mağaranı satın al!'
            }
        }
    },
    rize: {
        id: 'rize',
        name: 'Rize',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'cay',
                name: 'Çay Toplayıcısı',
                description: 'Çay topla, sepeti dolduramazsan köye rezil olursun! 🍵',
                points: 150,
                duration: '3 saat',
                type: 'activity'
            },
            {
                id: 'ayder',
                name: 'Yayla Delisi',
                description: 'Ayder\'de hamsi tava ye, yaylada hamsi mi olur deme! 🐟',
                points: 120,
                duration: '2 saat',
                type: 'food'
            },
            {
                id: 'zipline',
                name: 'Uçan Karadenizli',
                description: 'Zipline yap, "hoooğğ" diye bağırmadan inme! 🎢',
                points: 180,
                duration: '1 saat',
                type: 'adventure'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Çay Stajyeri',
                description: '3 aktivite tamamla, çay demlemesini öğren!'
            },
            silver: {
                icon: '🥈',
                name: 'Yayla Şampiyonu',
                description: '5 aktivite tamamla, artık gerçek bir Rizeli oldun!'
            },
            gold: {
                icon: '🥇',
                name: 'Çay Ağası',
                description: 'Tüm aktiviteleri tamamla, kendi çay fabrikanını kur!'
            }
        }
    },
    adana: {
        id: 'adana',
        name: 'Adana',
        region: 'akdeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'kebap',
                name: 'Ateş Savaşçısı',
                description: 'Acılı Adana kebap ye, "Az acılı olsun" dersen şehri terk et! 🌶️',
                points: 150,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'seyhan',
                name: 'Sıcak Savaşçı',
                description: 'Öğlen sıcağında Seyhan Köprüsü\'nü yürüyerek geç, ter garantili 🌞',
                points: 120,
                duration: '30 dakika',
                type: 'activity'
            },
            {
                id: 'salgam',
                name: 'Şalgam Ustası',
                description: 'Bir bardak acı şalgamı tek dikişte bitir, gözünden yaş gelmezse kaybedersin 🥤',
                points: 130,
                duration: '15 dakika',
                type: 'food'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Acı Çaylağı',
                description: '3 aktivite tamamla, biberle barış!'
            },
            silver: {
                icon: '🥈',
                name: 'Kebap Sevdalısı',
                description: '5 aktivite tamamla, artık zılgıt çekebilirsin!'
            },
            gold: {
                icon: '🥇',
                name: 'Adana Beyi',
                description: 'Tüm aktiviteleri tamamla, kendi kebapçını aç!'
            }
        }
    },
    samsun: {
        id: 'samsun',
        name: 'Samsun',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'pide',
                name: 'Pide Profesörü',
                description: 'Terme pidesi ye, kaşarı uzadıkça uzasın! 🧀',
                points: 120,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'bandirma',
                name: 'Tarih Dedektifi',
                description: 'Bandırma Vapuru\'nu gez, Ata\'nın izinde selfie çek 📸',
                points: 140,
                duration: '2 saat',
                type: 'historical'
            },
            {
                id: 'amazon',
                name: 'Sahil Gezgini',
                description: 'Amazon Koyu\'nda yürü, Karadeniz\'in tek plajlı ilinde tatil yap 🏖️',
                points: 130,
                duration: '3 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Pide Çırağı',
                description: '3 aktivite tamamla, hamuru açmaya başla!'
            },
            silver: {
                icon: '🥈',
                name: 'Sahil Kahramanı',
                description: '5 aktivite tamamla, artık gerçek bir Samsunlusun!'
            },
            gold: {
                icon: '🥇',
                name: 'Karadeniz Lordu',
                description: 'Tüm aktiviteleri tamamla, kendi pide fırınını aç!'
            }
        }
    },
    mardin: {
        id: 'mardin',
        name: 'Mardin',
        region: 'guneydogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'taslar',
                name: 'Taş Ustası',
                description: 'Taş evlerde kaybol, "hepsi birbirine benziyor" deme! 🏰',
                points: 140,
                duration: '3 saat',
                type: 'cultural'
            },
            {
                id: 'ikbebet',
                name: 'İkbebet Avcısı',
                description: 'İkbebet ye, "bu içli köfte değil mi?" diyenlere gülümse! 🥘',
                points: 120,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'deyrulzafaran',
                name: 'Manastır Gezgini',
                description: 'Deyrulzafaran\'ı gez, "safran nerede?" diye sorma! 🏛️',
                points: 150,
                duration: '2 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Telkari Çırağı',
                description: '3 aktivite tamamla, gümüşü tanı!'
            },
            silver: {
                icon: '🥈',
                name: 'Taş Ustası',
                description: '5 aktivite tamamla, mimariye aşık ol!'
            },
            gold: {
                icon: '🥇',
                name: 'Mardin Beyi',
                description: 'Tüm aktiviteleri tamamla, konağını restore et!'
            }
        }
    },
    batman: {
        id: 'batman',
        name: 'Batman',
        region: 'guneydogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'hasankeyf',
                name: 'Tarih Dalgıcı',
                description: 'Hasankeyf\'i gör, "sualtı müzesi gibi" de! 🏊‍♂️',
                points: 160,
                duration: '4 saat',
                type: 'historical'
            },
            {
                id: 'petrol',
                name: 'Petrol Dedektifi',
                description: 'Petrol kuyularını gez, "benzin bedava mı?" deme! ⛽',
                points: 130,
                duration: '2 saat',
                type: 'industrial'
            },
            {
                id: 'pide',
                name: 'Pide Filozofu',
                description: 'Batmanın meşhur pidesini ye, "lahmacun mu bu?" deme! 🥙',
                points: 120,
                duration: '1 saat',
                type: 'food'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Hasankeyf Çırağı',
                description: '3 aktivite tamamla, tarihi yaşa!'
            },
            silver: {
                icon: '🥈',
                name: 'Petrol Kâşifi',
                description: '5 aktivite tamamla, kara altını tanı!'
            },
            gold: {
                icon: '🥇',
                name: 'Batman Beyi',
                description: 'Tüm aktiviteleri tamamla, süper kahraman ol!'
            }
        }
    },
    van: {
        id: 'van',
        name: 'Van',
        region: 'dogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'kahvalti',
                name: 'Kahvaltı Profesörü',
                description: 'Van kahvaltısında 30 çeşit ye, "bu kadar da olmaz!" deme! 🍳',
                points: 150,
                duration: '3 saat',
                type: 'food'
            },
            {
                id: 'kedi',
                name: 'Kedi Whisperer\'ı',
                description: 'Van kedisiyle göz göze gel, farklı renkte gözlerine şaşırma! 🐱',
                points: 130,
                duration: '1 saat',
                type: 'activity'
            },
            {
                id: 'akdamar',
                name: 'Ada Kaşifi',
                description: 'Akdamar Adası\'na git, kiliseyi gör, efsaneyi dinle! ⛪',
                points: 160,
                duration: '4 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Otlu Peynir Çırağı',
                description: '3 aktivite tamamla, otları tanımaya başla!'
            },
            silver: {
                icon: '🥈',
                name: 'Göl Kaptanı',
                description: '5 aktivite tamamla, Van Gölü\'nü fethet!'
            },
            gold: {
                icon: '🥇',
                name: 'Van Beyi',
                description: 'Tüm aktiviteleri tamamla, kahvaltı salonu aç!'
            }
        }
    },
    balikesir: {
        id: 'balikesir',
        name: 'Balıkesir',
        region: 'marmara',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'hosgelden',
                name: 'Höşmerim Avcısı',
                description: 'Höşmerim ye, "bu tatlı peynirden mi yapılıyor?" diye şaşır 🧀',
                points: 120,
                duration: '30 dakika',
                type: 'food'
            },
            {
                id: 'cunda',
                name: 'Ada Gezgini',
                description: 'Cunda\'da rakı-balık yap, "Ayvalık tostu yesek mi?" deme! 🐟',
                points: 150,
                duration: '3 saat',
                type: 'food'
            },
            {
                id: 'sarimsakli',
                name: 'Plaj Gurusu',
                description: 'Sarımsaklı\'da denize gir, sarımsak kokusunu arayan turistleri izle 🏊‍♂️',
                points: 130,
                duration: '2 saat',
                type: 'activity'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Zeytin Çırağı',
                description: '3 aktivite tamamla, zeytinyağının hakkını ver!'
            },
            silver: {
                icon: '🥈',
                name: 'Körfez Kaptanı',
                description: '5 aktivite tamamla, adalara sefer düzenle!'
            },
            gold: {
                icon: '🥇',
                name: 'Balıkesir Beyi',
                description: 'Tüm aktiviteleri tamamla, kendi zeytinliğini dik!'
            }
        }
    },
    manisa: {
        id: 'manisa',
        name: 'Manisa',
        region: 'ege',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'mesir',
                name: 'Mesir Ustası',
                description: 'Mesir macunu festivali\'nde kapış, "bu şifalı şeker mi?" deme! 🍬',
                points: 140,
                duration: '2 saat',
                type: 'cultural'
            },
            {
                id: 'sultaniye',
                name: 'Üzüm Eksperi',
                description: 'Sultaniye üzümü ye, çekirdeksiz olduğuna üç kez emin ol 🍇',
                points: 120,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'spil',
                name: 'Dağ Kaşifi',
                description: 'Spil Dağı\'nda ağlayan kaya\'yı bul, teselli etmeye çalışma! 🏔️',
                points: 150,
                duration: '3 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Tarzan Çırağı',
                description: '3 aktivite tamamla, şehzadelere selam dur!'
            },
            silver: {
                icon: '🥈',
                name: 'Mesir Şifacısı',
                description: '5 aktivite tamamla, macunu havadan kap!'
            },
            gold: {
                icon: '🥇',
                name: 'Manisa Sultanı',
                description: 'Tüm aktiviteleri tamamla, kendi bağını kur!'
            }
        }
    },
    afyonkarahisar: {
        id: 'afyonkarahisar',
        name: 'Afyonkarahisar',
        region: 'ege',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'sucuk',
                name: 'Sucuk Sommelier\'i',
                description: 'Sabah kahvaltısında sucuk ye, "bu Afyon sucuğu mu?" diye üç kez sor 🥓',
                points: 130,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'kaymak',
                name: 'Kaymak Filozofu',
                description: 'Kaymak ye, "Bu kadar kaymaklı yol görmedim" esprisini yap, gülen çıkmayacak 🥛',
                points: 120,
                duration: '30 dakika',
                type: 'food'
            },
            {
                id: 'kale',
                name: 'Kale Fatihi',
                description: 'Afyon Kalesi\'ne tırman, nefes nefese "manzara güzelmiş" de 🏰',
                points: 150,
                duration: '2 saat',
                type: 'activity'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Lokum Çırağı',
                description: '3 aktivite tamamla, şekere bulanmaya başla!'
            },
            silver: {
                icon: '🥈',
                name: 'Termal Uzmanı',
                description: '5 aktivite tamamla, kaplıcada buruş!'
            },
            gold: {
                icon: '🥇',
                name: 'Afyon Ağası',
                description: 'Tüm aktiviteleri tamamla, sucuk fabrikası aç!'
            }
        }
    },
    kutahya: {
        id: 'kutahya',
        name: 'Kütahya',
        region: 'ege',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'cinili',
                name: 'Çini Dedektifi',
                description: 'Çini atölyesinde vazo boya, yamuk olursa "modern sanat" de geç 🎨',
                points: 140,
                duration: '2 saat',
                type: 'art'
            },
            {
                id: 'germiyan',
                name: 'Sokak Gezgini',
                description: 'Germiyan Sokağı\'nda fotoğraf çek, filtre kullanma, zaten vintage! 📸',
                points: 120,
                duration: '1.5 saat',
                type: 'cultural'
            },
            {
                id: 'aizonai',
                name: 'Antik Kaşif',
                description: 'Aizonai\'de Zeus Tapınağı\'nı gez, Yunan tanrılarına selam çak ⛪',
                points: 150,
                duration: '3 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Çini Çırağı',
                description: '3 aktivite tamamla, fırça tutmayı öğren!'
            },
            silver: {
                icon: '🥈',
                name: 'Porselen Ustası',
                description: '5 aktivite tamamla, desenler çizmeye başla!'
            },
            gold: {
                icon: '🥇',
                name: 'Kütahya Beyi',
                description: 'Tüm aktiviteleri tamamla, kendi çini atölyeni aç!'
            }
        }
    },
    usak: {
        id: 'usak',
        name: 'Uşak',
        region: 'ege',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'tarhana',
                name: 'Tarhana Profesörü',
                description: 'Tarhana çorbası iç, "bu hazır tarhana mı?" diyenlere ders ver 🥣',
                points: 120,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'halı',
                name: 'Halı Eksperi',
                description: 'Halı dokuma atölyesinde düğüm at, parmaklarını düğümleme! 🧶',
                points: 140,
                duration: '2 saat',
                type: 'cultural'
            },
            {
                id: 'taskoprü',
                name: 'Köprü Muhafızı',
                description: 'Taşköprü\'de fotoğraf çek, Roma\'ya selam gönder 🌉',
                points: 130,
                duration: '1 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Dokuma Çırağı',
                description: '3 aktivite tamamla, mekiği tanımaya başla!'
            },
            silver: {
                icon: '🥈',
                name: 'Tarhana Ustası',
                description: '5 aktivite tamamla, tarhanayı sergiye ser!'
            },
            gold: '',
            name: 'Uşak Ağası',
            description: 'Tüm aktiviteleri tamamla, halı fabrikası kur!'
        }
    },
    ordu: {
        id: 'ordu',
        name: 'Ordu',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'findik',
                name: 'Fındık Cambazı',
                description: 'Fındık bahçesinde toplama yap, "bu niye Nutella\'da yok?" deme! 🥜',
                points: 150,
                duration: '3 saat',
                type: 'activity'
            },
            {
                id: 'boztepe',
                name: 'Teleferik Kahramanı',
                description: 'Boztepe\'ye teleferikle çık, "yürüsek daha mı iyiydi?" diye düşün 🚡',
                points: 120,
                duration: '2 saat',
                type: 'activity'
            },
            {
                id: 'persembe',
                name: 'Yaylacı Başı',
                description: 'Perşembe Yaylası\'nda hamsi tava ye, "deniz nerede?" diye sorma! 🐟',
                points: 130,
                duration: '4 saat',
                type: 'food'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Fındık Çırağı',
                description: '3 aktivite tamamla, dalından toplamayı öğren!'
            },
            silver: {
                icon: '🥈',
                name: 'Yayla Sevdalısı',
                description: '5 aktivite tamamla, sisli havaya alış!'
            },
            gold: {
                icon: '🥇',
                name: 'Ordunun Ağası',
                description: 'Tüm aktiviteleri tamamla, fındık bahçeni kur!'
            }
        }
    },
    giresun: {
        id: 'giresun',
        name: 'Giresun',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'ada',
                name: 'Ada Kâşifi',
                description: 'Giresun Adası\'na çık, Amazon kadınlarını aramaya çalışma! 🏝️',
                points: 160,
                duration: '3 saat',
                type: 'adventure'
            },
            {
                id: 'kiraz',
                name: 'Kiraz Dedektifi',
                description: 'Giresun kirazı ye, çekirdeğini sakın yutma, şans getirmez! 🍒',
                points: 120,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'kale',
                name: 'Kale Bekçisi',
                description: 'Giresun Kalesi\'nde gün batımını izle, "uçsam mı?" diye düşünme! 🏰',
                points: 140,
                duration: '2 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Fındık Toplayıcısı',
                description: '3 aktivite tamamla, sepeti doldur!'
            },
            silver: {
                icon: '🥈',
                name: 'Ada Yolcusu',
                description: '5 aktivite tamamla, dalgalara meydan oku!'
            },
            gold: {
                icon: '🥇',
                name: 'Giresun Beyi',
                description: 'Tüm aktiviteleri tamamla, kendi kiraz bahçeni aç!'
            }
        }
    },
    artvin: {
        id: 'artvin',
        name: 'Artvin',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'macahel',
                name: 'Bal Avcısı',
                description: 'Macahel\'de organik bal ye, "arılar neden bu kadar mutlu?" diye sor 🍯',
                points: 140,
                duration: '2 saat',
                type: 'food'
            },
            {
                id: 'kackar',
                name: 'Dağ Keçisi',
                description: 'Kaçkar\'a tırman, zirvede "eve dönmek istiyorum" deme! ⛰️',
                points: 200,
                duration: '8 saat',
                type: 'adventure'
            },
            {
                id: 'boğa',
                name: 'Boğa Güreşi Spikeri',
                description: 'Kafkasör\'de boğa güreşi izle, İspanya\'dakinden farklı olduğunu anla! 🐂',
                points: 150,
                duration: '3 saat',
                type: 'cultural'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Yayla Çaylağı',
                description: '3 aktivite tamamla, yükseklik korkunu yen!'
            },
            silver: {
                icon: '🥈',
                name: 'Dağ Kartalı',
                description: '5 aktivite tamamla, bulutların üstüne çık!'
            },
            gold: {
                icon: '🥇',
                name: 'Artvin Beyi',
                description: 'Tüm aktiviteleri tamamla, kendi arı kovanını kur!'
            }
        }
    },
    sinop: {
        id: 'sinop',
        name: 'Sinop',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'hamsi',
                name: 'Hamsi Filozofu',
                description: 'Limanda hamsi ye, "bu balık değil mi?" diyenlere gülümse 🐟',
                points: 130,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'cezaevi',
                name: 'Hapishane Turisti',
                description: 'Tarihi cezaevini gez, "Buradan kaçılmaz!" diyen Yılmaz Güney\'i hatırla 🏰',
                points: 140,
                duration: '2 saat',
                type: 'historical'
            },
            {
                id: 'ince',
                name: 'İnceburun Kâşifi',
                description: 'Türkiye\'nin en kuzey noktasında selfie çek, kuzeye el salla! 📸',
                points: 150,
                duration: '3 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Balıkçı Çırağı',
                description: '3 aktivite tamamla, ağları toplamayı öğren!'
            },
            silver: {
                icon: '🥈',
                name: 'Deniz Kurdu',
                description: '5 aktivite tamamla, pusulanı kaybetme!'
            },
            gold: {
                icon: '🥇',
                name: 'Sinop Kaptanı',
                description: 'Tüm aktiviteleri tamamla, kendi tekneyi al!'
            }
        }
    },
    kastamonu: {
        id: 'kastamonu',
        name: 'Kastamonu',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'pastirma',
                name: 'Pastırma Avcısı',
                description: 'Kastamonu pastırması ye, çemeni say! 🥩',
                points: 130,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'ilgaz',
                name: 'Kayak Kahramanı',
                description: 'Ilgaz\'da kayak yap, "kar neden bu kadar beyaz?" deme! ⛷️',
                points: 170,
                duration: '4 saat',
                type: 'adventure'
            },
            {
                id: 'saat',
                name: 'Kule Bekçisi',
                description: 'Saat Kulesi\'nden şehri izle, zamanı unutma! 🕰️',
                points: 120,
                duration: '1 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Sarımsak Çırağı',
                description: '3 aktivite tamamla, kokuya alış!'
            },
            silver: {
                icon: '🥈',
                name: 'Dağ Kaptanı',
                description: '5 aktivite tamamla, zirveye çık!'
            },
            gold: {
                icon: '🥇',
                name: 'Kastamonu Beyi',
                description: 'Tüm aktiviteleri tamamla, kayak merkezi aç!'
            }
        }
    },
    corum: {
        id: 'corum',
        name: 'Çorum',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'leblebi',
                name: 'Leblebi Ustası',
                description: 'Çorum leblebisi ye, "nohut bu mu?" deme! 🥜',
                points: 120,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'hattusha',
                name: 'Hitit Dedektifi',
                description: 'Hattuşaş\'ta Hitit Kralı gibi poz ver! 👑',
                points: 160,
                duration: '4 saat',
                type: 'historical'
            },
            {
                id: 'incesu',
                name: 'Kanyon Kaşifi',
                description: 'İncesu Kanyonu\'nda yürü, yankı yap! 🏞️',
                points: 140,
                duration: '3 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Leblebi Çırağı',
                description: '3 aktivite tamamla, nohudu kavur!'
            },
            silver: {
                icon: '🥈',
                name: 'Hitit Prensi',
                description: '5 aktivite tamamla, tarihi yaşa!'
            },
            gold: {
                icon: '🥇',
                name: 'Çorum Beyi',
                description: 'Tüm aktiviteleri tamamla, leblebi fabrikası kur!'
            }
        }
    },
    yozgat: {
        id: 'yozgat',
        name: 'Yozgat',
        region: 'ic_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'testi',
                name: 'Testi Kebabı Dedektifi',
                description: 'Testi kebabını kır, "Neden çömleğe koymadınız?" deme! 🍖',
                points: 140,
                duration: '2 saat',
                type: 'food'
            },
            {
                id: 'sarikaya',
                name: 'Roma Havuzcusu',
                description: 'Sarıkaya Roma Hamamı\'nda poz ver, "Sezar da burda yüzdü mü?" diye sor 🏊‍♂️',
                points: 130,
                duration: '1 saat',
                type: 'historical'
            },
            {
                id: 'saat',
                name: 'Saat Ustası',
                description: 'Saat Kulesi\'nde "Yozgat Saat Kaç?" türküsünü mırıldan ⏰',
                points: 120,
                duration: '30 dakika',
                type: 'cultural'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Bozok Çırağı',
                description: '3 aktivite tamamla, arabaşı çorbasını tanı!'
            },
            silver: {
                icon: '🥈',
                name: 'Testi Ustası',
                description: '5 aktivite tamamla, çömlek kırmayı öğren!'
            },
            gold: {
                icon: '🥇',
                name: 'Yozgat Beyi',
                description: 'Tüm aktiviteleri tamamla, kendi lokantanı aç!'
            }
        }
    },
    sivas: {
        id: 'sivas',
        name: 'Sivas',
        region: 'ic_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'kangal',
                name: 'Köpek Whisperer\'ı',
                description: 'Kangal köpeğiyle arkadaş ol, "bu yavru kurt mu?" deme! 🐕',
                points: 150,
                duration: '2 saat',
                type: 'activity'
            },
            {
                id: 'balikli',
                name: 'Kaplıca Kaşifi',
                description: 'Balıklı Kaplıca\'da yüz, balıklarla arkadaş ol! 🐟',
                points: 130,
                duration: '3 saat',
                type: 'nature'
            },
            {
                id: 'kose',
                name: 'Köfte Ustası',
                description: 'Köse köftesi ye, "bu neden bu kadar büyük?" deme! 🍖',
                points: 120,
                duration: '1 saat',
                type: 'food'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Kangal Çırağı',
                description: '3 aktivite tamamla, sürüyü koru!'
            },
            silver: {
                icon: '🥈',
                name: 'Madımak Ustası',
                description: '5 aktivite tamamla, otları topla!'
            },
            gold: {
                icon: '🥇',
                name: 'Sivas Beyi',
                description: 'Tüm aktiviteleri tamamla, kangal çiftliği kur!'
            }
        }
    },
    tokat: {
        id: 'tokat',
        name: 'Tokat',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'kebap',
                name: 'Kebap Virtüözü',
                description: 'Tokat kebabı ye, "bu nasıl bu kadar yumuşak?" diye sor! 🥩',
                points: 140,
                duration: '2 saat',
                type: 'food'
            },
            {
                id: 'yazmaci',
                name: 'Yazma Ustası',
                description: 'Tokat yazması yap, deseni şaşırma! 🎨',
                points: 150,
                duration: '3 saat',
                type: 'cultural'
            },
            {
                id: 'saat',
                name: 'Saat Dedektifi',
                description: 'Saat Kulesi\'nde zaman geçir, saati sorma! ⏰',
                points: 120,
                duration: '1 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Yazma Çırağı',
                description: '3 aktivite tamamla, boyaları karıştır!'
            },
            silver: {
                icon: '🥈',
                name: 'Kebap Ustası',
                description: '5 aktivite tamamla, eti pişir!'
            },
            gold: {
                icon: '🥇',
                name: 'Tokat Beyi',
                description: 'Tüm aktiviteleri tamamla, yazmacı dükkanı aç!'
            }
        }
    },
    amasya: {
        id: 'amasya',
        name: 'Amasya',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'elma',
                name: 'Elma Dedektifi',
                description: 'Amasya elması topla, "bu misket elması mı?" deme! 🍎',
                points: 130,
                duration: '2 saat',
                type: 'nature'
            },
            {
                id: 'kral',
                name: 'Kral Mezarı Kaşifi',
                description: 'Kral Kaya Mezarları\'nı gez, "asansör nerede?" deme! ⚰️',
                points: 150,
                duration: '3 saat',
                type: 'historical'
            },
            {
                id: 'yaliboyu',
                name: 'Yalıboyu Gezgini',
                description: 'Yalıboyu evlerinde fotoğraf çek, Yeşilırmak\'a düşme! 🏠',
                points: 140,
                duration: '2 saat',
                type: 'cultural'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Şehzade Çırağı',
                description: '3 aktivite tamamla, tarihe yolculuk et!'
            },
            silver: {
                icon: '🥈',
                name: 'Elma Ustası',
                description: '5 aktivite tamamla, bahçeyi büyüt!'
            },
            gold: {
                icon: '🥇',
                name: 'Amasya Beyi',
                description: 'Tüm aktiviteleri tamamla, elma bahçesi kur!'
            }
        }
    },
    malatya: {
        id: 'malatya',
        name: 'Malatya',
        region: 'dogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'kayisi',
                name: 'Kayısı Dedektifi',
                description: 'Kayısı ye, "kuru erik gibi" diyenlere ders ver! 🍑',
                points: 130,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'aslantepe',
                name: 'Höyük Kaşifi',
                description: 'Aslantepe Höyüğü\'nde kazı yap, define arama! 🏺',
                points: 150,
                duration: '3 saat',
                type: 'historical'
            },
            {
                id: 'tohma',
                name: 'Kanyon Maceraperest',
                description: 'Tohma Kanyonu\'nda rafting yap, "su çok soğuk" deme! 🛶',
                points: 160,
                duration: '4 saat',
                type: 'adventure'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Kayısı Çırağı',
                description: '3 aktivite tamamla, çekirdeği çıkarmayı öğren!'
            },
            silver: {
                icon: '🥈',
                name: 'Höyük Bekçisi',
                description: '5 aktivite tamamla, tarihe yolculuk et!'
            },
            gold: {
                icon: '🥇',
                name: 'Malatya Beyi',
                description: 'Tüm aktiviteleri tamamla, kayısı bahçeni kur!'
            }
        }
    },
    elazig: {
        id: 'elazig',
        name: 'Elazığ',
        region: 'dogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'cigkofte',
                name: 'Çiğköfte Ustası',
                description: 'Acılı çiğköfte yoğur, "elim yandı" deme! 🌶️',
                points: 140,
                duration: '2 saat',
                type: 'food'
            },
            {
                id: 'harput',
                name: 'Kale Fatihi',
                description: 'Harput Kalesi\'nde türkü söyle, "Çayda Çıra" bilmiyorum deme! 🏰',
                points: 130,
                duration: '3 saat',
                type: 'cultural'
            },
            {
                id: 'hazar',
                name: 'Göl Kaptanı',
                description: 'Hazar Gölü\'nde yüz, "deniz daha iyiydi" deme! 🏊‍♂️',
                points: 120,
                duration: '2 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Orcik Çırağı',
                description: '3 aktivite tamamla, cevizi say!'
            },
            silver: {
                icon: '🥈',
                name: 'Harput Ozanı',
                description: '5 aktivite tamamla, türküleri öğren!'
            },
            gold: {
                icon: '🥇',
                name: 'Gakkoş Reisi',
                description: 'Tüm aktiviteleri tamamla, çiğköfte dükkanı aç!'
            }
        }
    },
    bingol: {
        id: 'bingol',
        name: 'Bingöl',
        region: 'dogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'keklik',
                name: 'Yayla Gezgini',
                description: 'Keklik Şelalesi\'nde piknik yap, yağmur yağarsa şaşırma! 🏞️',
                points: 140,
                duration: '4 saat',
                type: 'nature'
            },
            {
                id: 'bal',
                name: 'Bal Tadımcısı',
                description: 'Bingöl balı ye, "şeker mi kattınız?" diye sorma! 🍯',
                points: 120,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'yedisu',
                name: 'Su Avcısı',
                description: 'Yedi Suları say, "sekizincisi nerede?" deme! 💧',
                points: 150,
                duration: '3 saat',
                type: 'adventure'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Çoban Çırağı',
                description: '3 aktivite tamamla, koyunları say!'
            },
            silver: {
                icon: '🥈',
                name: 'Yayla Sevdalısı',
                description: '5 aktivite tamamla, çiçekleri tanı!'
            },
            gold: {
                icon: '🥇',
                name: 'Bingöl Ağası',
                description: 'Tüm aktiviteleri tamamla, arıcılığa başla!'
            }
        }
    },
    erzincan: {
        id: 'erzincan',
        name: 'Erzincan',
        region: 'dogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'tulum',
                name: 'Tulum Peyniri Avcısı',
                description: 'Tulum peyniri ye, "bu normal peynir değil mi?" diyenlere gülümse 🧀',
                points: 130,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'girlevik',
                name: 'Şelale Fatihi',
                description: 'Girlevik Şelalesi\'nde selfie çek, ıslanmadan yapamazsın! 💦',
                points: 140,
                duration: '2 saat',
                type: 'nature'
            },
            {
                id: 'eksi',
                name: 'Kayak Kahramanı',
                description: 'Ergan\'da kayak yap, "düz yolda daha iyi kayıyorum" deme! ⛷️',
                points: 150,
                duration: '4 saat',
                type: 'sport'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Kemaliye Çırağı',
                description: '3 aktivite tamamla, dağları sev!'
            },
            silver: {
                icon: '🥈',
                name: 'Kartal Gözü',
                description: '5 aktivite tamamla, zirveleri fethet!'
            },
            gold: {
                icon: '🥇',
                name: 'Erzincan Beyi',
                description: 'Tüm aktiviteleri tamamla, tulum peyniri üret!'
            }
        }
    },
    bayburt: {
        id: 'bayburt',
        name: 'Bayburt',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'teleme',
                name: 'Teleme Ustası',
                description: 'Lor teleme ye, "bu peynir ekşimiş" deme! 🥛',
                points: 120,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'kale',
                name: 'Kale Muhafızı',
                description: 'Bayburt Kalesi\'nde Dede Korkut hikayesi dinle, uyuyakalma! 🏰',
                points: 140,
                duration: '2 saat',
                type: 'historical'
            },
            {
                id: 'sirakayalar',
                name: 'Şelale Gezgini',
                description: 'Sırakayalar Şelalesi\'nde serinle, "su çok soğuk" deme! 🏞️',
                points: 130,
                duration: '3 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Dede Korkut Çırağı',
                description: '3 aktivite tamamla, hikayeleri dinle!'
            },
            silver: {
                icon: '🥈',
                name: 'Ehram Dokuyucusu',
                description: '5 aktivite tamamla, geleneği yaşat!'
            },
            gold: {
                icon: '🥇',
                name: 'Bayburt Beyi',
                description: 'Tüm aktiviteleri tamamla, kendi kaleni kur!'
            }
        }
    },
    gumushane: {
        id: 'gumushane',
        name: 'Gümüşhane',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'pestil',
                name: 'Pestil Profesörü',
                description: 'Pestil ye, "bu meyve derisi mi?" diye düşünme! 🍇',
                points: 120,
                duration: '30 dakika',
                type: 'food'
            },
            {
                id: 'tomara',
                name: 'Şelale Avcısı',
                description: 'Tomara Şelalesi\'nde doğa yürüyüşü yap, yağmuru beklemeden ıslan! 🌧️',
                points: 150,
                duration: '3 saat',
                type: 'nature'
            },
            {
                id: 'karaca',
                name: 'Mağara Kaşifi',
                description: 'Karaca Mağarası\'nı gez, "burası Batman\'in evi mi?" deme! 🦇',
                points: 140,
                duration: '2 saat',
                type: 'adventure'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Köme Çırağı',
                description: '3 aktivite tamamla, cevizi tanı!'
            },
            silver: {
                icon: '🥈',
                name: 'Dağ Yürüyüşçüsü',
                description: '5 aktivite tamamla, zirveleri fethet!'
            },
            gold: {
                icon: '🥇',
                name: 'Gümüşhane Beyi',
                description: 'Tüm aktiviteleri tamamla, pestil-köme dükkanı aç!'
            }
        }
    },
    kars: {
        id: 'kars',
        name: 'Kars',
        region: 'dogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'kaz',
                name: 'Kaz Ustası',
                description: 'Kars kazı ye, "bu neden tavuk gibi değil?" deme! 🦢',
                points: 150,
                duration: '2 saat',
                type: 'food'
            },
            {
                id: 'ani',
                name: 'Harabe Kaşifi',
                description: 'Ani Harabeleri\'nde fotoğraf çek, İpek Yolu\'na selam gönder! 🏛️',
                points: 160,
                duration: '4 saat',
                type: 'historical'
            },
            {
                id: 'gravyer',
                name: 'Peynir Dedektifi',
                description: 'Kars gravyeri ye, "İsviçre peyniri mi bu?" diyenleri aydınlat! 🧀',
                points: 130,
                duration: '1 saat',
                type: 'food'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Çıldır Çırağı',
                description: '3 aktivite tamamla, buz üstünde yürümeyi öğren!'
            },
            silver: {
                icon: '🥈',
                name: 'Kale Bekçisi',
                description: '5 aktivite tamamla, tarihe yolculuk et!'
            },
            gold: {
                icon: '🥇',
                name: 'Kars Beyi',
                description: 'Tüm aktiviteleri tamamla, kendi mandıranı kur!'
            }
        }
    },
    ardahan: {
        id: 'ardahan',
        name: 'Ardahan',
        region: 'dogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'cildir',
                name: 'Buz Patencisi',
                description: 'Çıldır Gölü\'nde atlı kızak yap, "kayak daha kolaydı" deme! ⛸️',
                points: 160,
                duration: '3 saat',
                type: 'adventure'
            },
            {
                id: 'damal',
                name: 'Gölge Avcısı',
                description: 'Damal\'da Atatürk siluetini yakala, gölgeyi kaçırma! 🌄',
                points: 140,
                duration: '2 saat',
                type: 'cultural'
            },
            {
                id: 'kaskari',
                name: 'Kaşar Filozofu',
                description: 'Kaşar peyniri ye, "eski kaşar mı taze mi?" diye düşün! 🧀',
                points: 120,
                duration: '1 saat',
                type: 'food'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Yaylacı Çırağı',
                description: '3 aktivite tamamla, soğuğa alış!'
            },
            silver: {
                icon: '🥈',
                name: 'Göl Fatihi',
                description: '5 aktivite tamamla, buzu çöz!'
            },
            gold: {
                icon: '🥇',
                name: 'Ardahan Beyi',
                description: 'Tüm aktiviteleri tamamla, kendi çiftliğini kur!'
            }
        }
    },
    igdir: {
        id: 'igdir',
        name: 'Iğdır',
        region: 'dogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'kayisi',
                name: 'Kayısı Eksperi',
                description: 'Iğdır kayısısı ye, Malatyalılara çaktırma! 🍑',
                points: 130,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'agri',
                name: 'Dağ Fotoğrafçısı',
                description: 'Ağrı Dağı\'nı karşıdan çek, "Nuh\'un Gemisi görünüyor mu?" diye bakın! 🗻',
                points: 150,
                duration: '3 saat',
                type: 'nature'
            },
            {
                id: 'pamuk',
                name: 'Pamuk Şefi',
                description: 'Pamuk tarlasında fotoğraf çek, "kar yağmış gibi" de! ☁️',
                points: 140,
                duration: '2 saat',
                type: 'activity'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Pamuk Çırağı',
                description: '3 aktivite tamamla, mikroklimayı öğren!'
            },
            silver: {
                icon: '🥈',
                name: 'Meyve Ustası',
                description: '5 aktivite tamamla, bahçıvanlığı öğren!'
            },
            gold: {
                icon: '🥇',
                name: 'Iğdır Beyi',
                description: 'Tüm aktiviteleri tamamla, meyve bahçeni kur!'
            }
        }
    },
    agri: {
        id: 'agri',
        name: 'Ağrı',
        region: 'dogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'dagcilik',
                name: 'Zirve Avcısı',
                description: 'Ağrı Dağı\'na tırmanmaya çalış, "Nuh\'un Gemisi\'ni gördüm" de! 🏔️',
                points: 200,
                duration: '2 gün',
                type: 'adventure'
            },
            {
                id: 'abdigol',
                name: 'Kuş Gözlemcisi',
                description: 'Abidigöl\'de flamingo izle, "pembe neden bu kadar pembe?" diye sor! 🦩',
                points: 140,
                duration: '3 saat',
                type: 'nature'
            },
            {
                id: 'balbal',
                name: 'Taş Dedektifi',
                description: 'Balbal taşlarını bul, "bu emoji\'nin atası mı?" deme! 🗿',
                points: 130,
                duration: '2 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Dağcı Çırağı',
                description: '3 aktivite tamamla, zirveye hazırlan!'
            },
            silver: {
                icon: '🥈',
                name: 'Buzul Kaşifi',
                description: '5 aktivite tamamla, karla arkadaş ol!'
            },
            gold: {
                icon: '🥇',
                name: 'Ağrı Beyi',
                description: 'Tüm aktiviteleri tamamla, dağcılık kulübü aç!'
            }
        }
    },
    mus: {
        id: 'mus',
        name: 'Muş',
        region: 'dogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'laleler',
                name: 'Lale Avcısı',
                description: 'Muş lalelerini bul, "Hollanda\'dan mı getirdiniz?" deme! 🌷',
                points: 150,
                duration: '3 saat',
                type: 'nature'
            },
            {
                id: 'hasköy',
                name: 'Peynir Tadımcısı',
                description: 'Hasköy\'de keçi peyniri ye, "keçiler nerede?" diye sorma! 🧀',
                points: 120,
                duration: '2 saat',
                type: 'food'
            },
            {
                id: 'ovasi',
                name: 'Ova Kaşifi',
                description: 'Muş Ovası\'nda güneşin doğuşunu izle, uykunu getirme! 🌅',
                points: 140,
                duration: '2 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Lale Bahçıvanı',
                description: '3 aktivite tamamla, çiçekleri tanı!'
            },
            silver: {
                icon: '🥈',
                name: 'Ova Gezgini',
                description: '5 aktivite tamamla, doğayla bütünleş!'
            },
            gold: {
                icon: '🥇',
                name: 'Muş Beyi',
                description: 'Tüm aktiviteleri tamamla, lale bahçesi kur!'
            }
        }
    },
    bitlis: {
        id: 'bitlis',
        name: 'Bitlis',
        region: 'dogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'büryan',
                name: 'Büryan Ustası',
                description: 'Büryan kebabı ye, "bu neden kuyuda pişiyor?" deme! 🍖',
                points: 140,
                duration: '2 saat',
                type: 'food'
            },
            {
                id: 'nemrut',
                name: 'Krater Kaşifi',
                description: 'Nemrut Krater Gölü\'nde piknik yap, "yanardağ patlar mı?" diye sorma! 🌋',
                points: 160,
                duration: '4 saat',
                type: 'nature'
            },
            {
                id: 'kale',
                name: 'Kale Fatihi',
                description: 'Bitlis Kalesi\'nde gün batımını izle, "asansör yok mu?" deme! 🏰',
                points: 130,
                duration: '2 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'El Aman Çırağı',
                description: '3 aktivite tamamla, türküleri öğren!'
            },
            silver: {
                icon: '🥈',
                name: 'Büryan Ustası',
                description: '5 aktivite tamamla, kuyuyu yak!'
            },
            gold: {
                icon: '🥇',
                name: 'Bitlis Beyi',
                description: 'Tüm aktiviteleri tamamla, kendi hanını aç!'
            }
        }
    },
    siirt: {
        id: 'siirt',
        name: 'Siirt',
        region: 'guneydogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'pervari',
                name: 'Bal Gurmanı',
                description: 'Pervari balı ye, "arılar neden bu kadar yetenekli?" diye düşün! 🍯',
                points: 130,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'battaniye',
                name: 'Battaniye Dedektifi',
                description: 'Siirt battaniyesi al, "bu halı değil mi?" deme! 🧶',
                points: 120,
                duration: '2 saat',
                type: 'shopping'
            },
            {
                id: 'ters_lale',
                name: 'Ters Lale Avcısı',
                description: 'Ters laleyi bul, "neden düz durmuyor?" diye sorma! 🌷',
                points: 150,
                duration: '3 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Büryan Çırağı',
                description: '3 aktivite tamamla, fıstığı tanı!'
            },
            silver: {
                icon: '🥈',
                name: 'Perde Pilav Ustası',
                description: '5 aktivite tamamla, pirinci say!'
            },
            gold: {
                icon: '🥇',
                name: 'Siirt Beyi',
                description: 'Tüm aktiviteleri tamamla, bal üretmeye başla!'
            }
        }
    },
    sirnak: {
        id: 'sirnak',
        name: 'Şırnak',
        region: 'guneydogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'cudi',
                name: 'Dağ Fatihi',
                description: 'Cudi Dağı\'na tırman, zirvede şiir oku! 🏔️',
                points: 160,
                duration: '6 saat',
                type: 'adventure'
            },
            {
                id: 'sefine',
                name: 'Gemi Kaşifi',
                description: 'Nuh\'un Gemisi\'nin izlerini ara, "tekne turu var mı?" deme! ⛴️',
                points: 140,
                duration: '3 saat',
                type: 'historical'
            },
            {
                id: 'ficcin',
                name: 'Ficcin Ustası',
                description: 'Ficcin ye, "bu lahmacun değil mi?" diyenlere ders ver! 🥘',
                points: 120,
                duration: '1 saat',
                type: 'food'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Şal Şepik Çırağı',
                description: '3 aktivite tamamla, giysileri tanı!'
            },
            silver: {
                icon: '🥈',
                name: 'Dağ Kartalı',
                description: '5 aktivite tamamla, zirveleri fethet!'
            },
            gold: {
                icon: '🥇',
                name: 'Şırnak Beyi',
                description: 'Tüm aktiviteleri tamamla, kendi yaylana yerleş!'
            }
        }
    },
    hakkari: {
        id: 'hakkari',
        name: 'Hakkari',
        region: 'guneydogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'zap',
                name: 'Rafting Kahramanı',
                description: 'Zap Suyu\'nda rafting yap, "su neden bu kadar hızlı?" deme! 🛶',
                points: 180,
                duration: '4 saat',
                type: 'adventure'
            },
            {
                id: 'kilim',
                name: 'Kilim Dokumacısı',
                description: 'Hakkari kilimi dokumayı öğren, parmaklarını düğümleme! 🧶',
                points: 140,
                duration: '3 saat',
                type: 'cultural'
            },
            {
                id: 'sumbul',
                name: 'Çiçek Avcısı',
                description: 'Ters Lale ve Sümbül topla, "bunlar bahçeden mi?" deme! 🌺',
                points: 130,
                duration: '2 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Dağ Çırağı',
                description: '3 aktivite tamamla, yüksekliğe alış!'
            },
            silver: {
                icon: '🥈',
                name: 'Zap Kaptanı',
                description: '5 aktivite tamamla, suyla arkadaş ol!'
            },
            gold: {
                icon: '🥇',
                name: 'Hakkari Beyi',
                description: 'Tüm aktiviteleri tamamla, kilim atölyesi kur!'
            }
        }
    },
    diyarbakir: {
        id: 'diyarbakir',
        name: 'Diyarbakır',
        region: 'guneydogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'surlar',
                name: 'Sur Bekçisi',
                description: 'Diyarbakır surlarında yürü, "Çin Seddi buradan ilham almış" de! 🏰',
                points: 150,
                duration: '3 saat',
                type: 'historical'
            },
            {
                id: 'cigerpide',
                name: 'Ciğer Ustası',
                description: 'Ciğer pide ye, "bu kadar da lezzetli olmaz" deme! 🥩',
                points: 130,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'onminark',
                name: 'Köprü Kaşifi',
                description: 'On Gözlü Köprü\'de fotoğraf çek, gözleri sayma! 🌉',
                points: 140,
                duration: '2 saat',
                type: 'cultural'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Karpuz Çırağı',
                description: '3 aktivite tamamla, çekirdeği say!'
            },
            silver: {
                icon: '🥈',
                name: 'Sur Muhafızı',
                description: '5 aktivite tamamla, bazalt taşları tanı!'
            },
            gold: {
                icon: '🥇',
                name: 'Diyarbakır Beyi',
                description: 'Tüm aktiviteleri tamamla, ciğerci dükkanı aç!'
            }
        }
    },
    sanliurfa: {
        id: 'sanliurfa',
        name: 'Şanlıurfa',
        region: 'guneydogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'balikligol',
                name: 'Balık Besleyicisi',
                description: 'Balıklıgöl\'de balıkları besle, "bunlar Hz. İbrahim\'in balıkları mı?" de! 🐟',
                points: 120,
                duration: '1 saat',
                type: 'cultural'
            },
            {
                id: 'cig_kofte',
                name: 'Çiğköfte Virtüözü',
                description: 'Çiğköfte yoğur, "elim acıdı" deme! 🌶️',
                points: 150,
                duration: '2 saat',
                type: 'food'
            },
            {
                id: 'gobeklitepe',
                name: 'Tarih Dedektifi',
                description: 'Göbeklitepe\'yi gez, "bu taşları kim taşıdı?" diye düşün! 🏛️',
                points: 180,
                duration: '4 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Sıra Gecesi Çırağı',
                description: '3 aktivite tamamla, türküleri öğren!'
            },
            silver: {
                icon: '🥈',
                name: 'İsot Ustası',
                description: '5 aktivite tamamla, acıya alış!'
            },
            gold: {
                icon: '🥇',
                name: 'Urfa Beyi',
                description: 'Tüm aktiviteleri tamamla, kebapçı dükkanı aç!'
            }
        }
    },
    adiyaman: {
        id: 'adiyaman',
        name: 'Adıyaman',
        region: 'guneydogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'nemrut',
                name: 'Nemrut Fatihi',
                description: 'Nemrut\'ta gün doğumunu izle, heykellere "günaydın" de! 🌅',
                points: 200,
                duration: '6 saat',
                type: 'historical'
            },
            {
                id: 'cigkofte',
                name: 'Çiğköfte Eksperi',
                description: 'Adıyaman çiğköftesi ye, Urfa duymasın! 🌶️',
                points: 130,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'perre',
                name: 'Antik Şehir Kaşifi',
                description: 'Perre Antik Kenti\'ni gez, "Roma buraya da mı gelmiş?" de! 🏛️',
                points: 140,
                duration: '3 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Kommagene Çırağı',
                description: '3 aktivite tamamla, tarihe yolculuk et!'
            },
            silver: {
                icon: '🥈',
                name: 'Dağ Muhafızı',
                description: '5 aktivite tamamla, zirveye çık!'
            },
            gold: {
                icon: '🥇',
                name: 'Adıyaman Beyi',
                description: 'Tüm aktiviteleri tamamla, turizm şirketi kur!'
            }
        }
    },
    karaman: {
        id: 'karaman',
        name: 'Karaman',
        region: 'ic_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'divle',
                name: 'Peynir Dedektifi',
                description: 'Divle Obruğu peyniri tat, "bu mağarada ne işi var?" deme! 🧀',
                points: 140,
                duration: '2 saat',
                type: 'food'
            },
            {
                id: 'hatuniye',
                name: 'Medrese Kaşifi',
                description: 'Hatuniye Medresesi\'ni gez, "ders çalışılır mı burada?" diye sorma! 🏛️',
                points: 130,
                duration: '1 saat',
                type: 'historical'
            },
            {
                id: 'incesu',
                name: 'Mağara Fatihi',
                description: 'İncesu Mağarası\'nı keşfet, yarasalarla selfie çek! 🦇',
                points: 150,
                duration: '3 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Mevlana Çırağı',
                description: '3 aktivite tamamla, tarihe yolculuk et!'
            },
            silver: {
                icon: '🥈',
                name: 'Peynir Ustası',
                description: '5 aktivite tamamla, obruğu keşfet!'
            },
            gold: {
                icon: '🥇',
                name: 'Karaman Beyi',
                description: 'Tüm aktiviteleri tamamla, mağara peyniri üret!'
            }
        }
    },
    nigde: {
        id: 'nigde',
        name: 'Niğde',
        region: 'ic_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'patates',
                name: 'Patates Kralı',
                description: 'Patates hasadına katıl, "neden bu kadar çok?" deme! 🥔',
                points: 130,
                duration: '3 saat',
                type: 'activity'
            },
            {
                id: 'aladaglar',
                name: 'Dağcı Adayı',
                description: 'Aladağlar\'da kamp kur, yıldızları say! ⛺',
                points: 160,
                duration: '8 saat',
                type: 'nature'
            },
            {
                id: 'gumusler',
                name: 'Manastır Gezgini',
                description: 'Gümüşler Manastırı\'nı keşfet, freskleri bul! 🏰',
                points: 140,
                duration: '2 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Patates Çırağı',
                description: '3 aktivite tamamla, toprağı sev!'
            },
            silver: {
                icon: '🥈',
                name: 'Dağ Keçisi',
                description: '5 aktivite tamamla, zirveleri fethet!'
            },
            gold: {
                icon: '🥇',
                name: 'Niğde Beyi',
                description: 'Tüm aktiviteleri tamamla, çiftlik kur!'
            }
        }
    },
    aksaray: {
        id: 'aksaray',
        name: 'Aksaray',
        region: 'ic_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'ihlara',
                name: 'Vadi Kaşifi',
                description: 'Ihlara Vadisi\'nde yürüyüş yap, merdivenleri sayma! 🏃‍♂️',
                points: 170,
                duration: '5 saat',
                type: 'nature'
            },
            {
                id: 'somuncubaba',
                name: 'Hamur Ustası',
                description: 'Somuncu Baba Külliyesi\'ni ziyaret et, ekmeğini ye! 🥖',
                points: 130,
                duration: '2 saat',
                type: 'cultural'
            },
            {
                id: 'hasandagi',
                name: 'Volkan Avcısı',
                description: 'Hasan Dağı\'na tırman, "püskürecek mi?" diye sorma! 🌋',
                points: 180,
                duration: '6 saat',
                type: 'adventure'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Vadi Çırağı',
                description: '3 aktivite tamamla, kiliseyi bul!'
            },
            silver: {
                icon: '🥈',
                name: 'Kervansaray Bekçisi',
                description: '5 aktivite tamamla, İpek Yolu\'nu keşfet!'
            },
            gold: {
                icon: '🥇',
                name: 'Aksaray Beyi',
                description: 'Tüm aktiviteleri tamamla, turizm şirketi kur!'
            }
        }
    },
    kirsehir: {
        id: 'kirsehir',
        name: 'Kırşehir',
        region: 'ic_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'ahi',
                name: 'Ahi Dedektifi',
                description: 'Ahi Evran Külliyesi\'ni gez, esnaf geleneğini öğren! 🏺',
                points: 140,
                duration: '2 saat',
                type: 'historical'
            },
            {
                id: 'nevsehir',
                name: 'Çiğdem Avcısı',
                description: 'Kırşehir çiğdemini topla, "bu safran mı?" deme! 🌷',
                points: 120,
                duration: '3 saat',
                type: 'nature'
            },
            {
                id: 'abdal',
                name: 'Bozlak Ustası',
                description: 'Neşet Ertaş Müzesi\'nde bozlak dinle, gözyaşlarını tutma! 🎵',
                points: 130,
                duration: '2 saat',
                type: 'cultural'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Abdal Çırağı',
                description: '3 aktivite tamamla, bağlamayı öğren!'
            },
            silver: {
                icon: '🥈',
                name: 'Ahi Ustası',
                description: '5 aktivite tamamla, esnaf ol!'
            },
            gold: {
                icon: '🥇',
                name: 'Kırşehir Beyi',
                description: 'Tüm aktiviteleri tamamla, türkü evi aç!'
            }
        }
    },
    nevsehir: {
        id: 'nevsehir',
        name: 'Nevşehir',
        region: 'ic_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'balon',
                name: 'Balon Pilotu',
                description: 'Kapadokya\'da balon turu yap, "yere ne zaman ineceğiz?" deme! 🎈',
                points: 200,
                duration: '3 saat',
                type: 'adventure'
            },
            {
                id: 'yeraltisehri',
                name: 'Yeraltı Kaşifi',
                description: 'Derinkuyu Yeraltı Şehri\'ni gez, haritayı unutma! 🕯️',
                points: 150,
                duration: '2 saat',
                type: 'historical'
            },
            {
                id: 'testi',
                name: 'Çömlek Ustası',
                description: 'Avanos\'ta çömlek yap, çarkı devirme! 🏺',
                points: 140,
                duration: '2 saat',
                type: 'cultural'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Peri Bacası Çırağı',
                description: '3 aktivite tamamla, kayaları tanı!'
            },
            silver: {
                icon: '🥈',
                name: 'Balon Kaptanı',
                description: '5 aktivite tamamla, rüzgarı yakala!'
            },
            gold: {
                icon: '🥇',
                name: 'Kapadokya Beyi',
                description: 'Tüm aktiviteleri tamamla, butik otel aç!'
            }
        }
    },
    yozgat: {
        id: 'yozgat',
        name: 'Yozgat',
        region: 'ic_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'testi',
                name: 'Testi Kebabı Avcısı',
                description: 'Testi kebabı ye, testiyi kırarken dikkat et! 🍖',
                points: 140,
                duration: '2 saat',
                type: 'food'
            },
            {
                id: 'sarikaya',
                name: 'Roma Hamam Ustası',
                description: 'Sarıkaya Roma Hamamı\'nı gez, "su hala sıcak mı?" deme! 🏛️',
                points: 130,
                duration: '2 saat',
                type: 'historical'
            },
            {
                id: 'camlik',
                name: 'Milli Park Gezgini',
                description: 'Çamlık Milli Parkı\'nda piknik yap, sincapları besle! 🌲',
                points: 120,
                duration: '4 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Arabaşı Çırağı',
                description: '3 aktivite tamamla, çorbayı kaynat!'
            },
            silver: {
                icon: '🥈',
                name: 'Testi Ustası',
                description: '5 aktivite tamamla, kebabı pişir!'
            },
            gold: {
                icon: '🥇',
                name: 'Yozgat Beyi',
                description: 'Tüm aktiviteleri tamamla, lokanta aç!'
            }
        }
    },
    cankiri: {
        id: 'cankiri',
        name: 'Çankırı',
        region: 'ic_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'tuz',
                name: 'Tuz Madencisi',
                description: 'Tuz Mağarası\'nı gez, "burası neden tuzlu?" deme! 🧂',
                points: 150,
                duration: '3 saat',
                type: 'nature'
            },
            {
                id: 'yaran',
                name: 'Yaran Meclisi Üyesi',
                description: 'Yaran Kültürü\'nü öğren, sohbete karış! 👥',
                points: 140,
                duration: '4 saat',
                type: 'cultural'
            },
            {
                id: 'tas',
                name: 'Taş Helvacı',
                description: 'Çankırı taş helvasını ye, dişini kırma! 🍬',
                points: 120,
                duration: '1 saat',
                type: 'food'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Tuz Çırağı',
                description: '3 aktivite tamamla, madeni keşfet!'
            },
            silver: {
                icon: '🥈',
                name: 'Yaran Efesi',
                description: '5 aktivite tamamla, geleneği yaşat!'
            },
            gold: {
                icon: '🥇',
                name: 'Çankırı Beyi',
                description: 'Tüm aktiviteleri tamamla, helva dükkanı aç!'
            }
        }
    },
    aydin: {
        id: 'aydin',
        name: 'Aydın',
        region: 'ege',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'incir',
                name: 'İncir Dedektifi',
                description: 'Taze incir topla, "bu kuru üzüm mü?" deme! 🍇',
                points: 140,
                duration: '2 saat',
                type: 'nature'
            },
            {
                id: 'afrodisias',
                name: 'Antik Kent Kaşifi',
                description: 'Afrodisias\'ta Venüs\'ü ara, aşk tanrıçasına selam ver! 🏛️',
                points: 160,
                duration: '4 saat',
                type: 'historical'
            },
            {
                id: 'pideli',
                name: 'Pide Gurusu',
                description: 'Aydın pidesini ye, "bu lahmacun mu?" deme! 🥙',
                points: 130,
                duration: '1 saat',
                type: 'food'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'İncir Çırağı',
                description: '3 aktivite tamamla, bahçeyi sula!'
            },
            silver: {
                icon: '🥈',
                name: 'Efeler Kaptanı',
                description: '5 aktivite tamamla, zeybek oyna!'
            },
            gold: {
                icon: '🥇',
                name: 'Aydın Beyi',
                description: 'Tüm aktiviteleri tamamla, incir bahçesi kur!'
            }
        }
    },
    bartin: {
        id: 'bartin',
        name: 'Bartın',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'amasra',
                name: 'Balık Avcısı',
                description: 'Amasra\'da balık ye, "Fatih haklıymış" de! 🐟',
                points: 150,
                duration: '3 saat',
                type: 'food'
            },
            {
                id: 'guzelcehisar',
                name: 'Bazalt Dedektifi',
                description: 'Güzelcehisar Bazalt Kayaları\'nı incele, "bunlar lego mu?" deme! 🗿',
                points: 140,
                duration: '2 saat',
                type: 'nature'
            },
            {
                id: 'telkirma',
                name: 'Tel Kırma Ustası',
                description: 'Tel kırma sanatını öğren, iğneyi düşürme! 🧵',
                points: 130,
                duration: '2 saat',
                type: 'cultural'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Balıkçı Çırağı',
                description: '3 aktivite tamamla, ağları ör!'
            },
            silver: {
                icon: '🥈',
                name: 'Liman Kaptanı',
                description: '5 aktivite tamamla, dalgaları say!'
            },
            gold: {
                icon: '🥇',
                name: 'Bartın Beyi',
                description: 'Tüm aktiviteleri tamamla, balık restoranı aç!'
            }
        }
    },
    bilecik: {
        id: 'bilecik',
        name: 'Bilecik',
        region: 'marmara',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'seyh',
                name: 'Şeyh Takipçisi',
                description: 'Şeyh Edebali Türbesi\'ni ziyaret et, Osmanlı\'nın doğuşunu hisset! 🕌',
                points: 140,
                duration: '2 saat',
                type: 'historical'
            },
            {
                id: 'bozuyuk',
                name: 'Çini Ustası',
                description: 'Bozüyük çinilerini incele, desenleri ezberle! 🎨',
                points: 130,
                duration: '2 saat',
                type: 'cultural'
            },
            {
                id: 'osmaneli',
                name: 'Ayva Avcısı',
                description: 'Osmaneli ayvasını topla, "bu armut mu?" deme! 🍐',
                points: 120,
                duration: '2 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Çini Çırağı',
                description: '3 aktivite tamamla, fırçayı tut!'
            },
            silver: {
                icon: '🥈',
                name: 'Osmanlı Sipahisi',
                description: '5 aktivite tamamla, tarihi yaşa!'
            },
            gold: {
                icon: '🥇',
                name: 'Bilecik Beyi',
                description: 'Tüm aktiviteleri tamamla, çini atölyesi kur!'
            }
        }
    },
    bolu: {
        id: 'bolu',
        name: 'Bolu',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'mengen',
                name: 'Aşçılık Virtüözü',
                description: 'Mengen\'de yemek kursu al, "bu kadar usta olmaz!" de! 👨‍🍳',
                points: 160,
                duration: '4 saat',
                type: 'cultural'
            },
            {
                id: 'golcuk',
                name: 'Göl Kaşifi',
                description: 'Gölcük\'te piknik yap, ördekleri besle! 🦆',
                points: 130,
                duration: '3 saat',
                type: 'nature'
            },
            {
                id: 'kartalkaya',
                name: 'Kayak Ustası',
                description: 'Kartalkaya\'da kayak yap, kardan adama takla attırma! ⛷️',
                points: 150,
                duration: '4 saat',
                type: 'adventure'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Aşçı Çırağı',
                description: '3 aktivite tamamla, sosu karıştır!'
            },
            silver: {
                icon: '🥈',
                name: 'Kar Kaptanı',
                description: '5 aktivite tamamla, pisti fethet!'
            },
            gold: {
                icon: '🥇',
                name: 'Bolu Beyi',
                description: 'Tüm aktiviteleri tamamla, restoran aç!'
            }
        }
    },
    burdur: {
        id: 'burdur',
        name: 'Burdur',
        region: 'akdeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'sagalassos',
                name: 'Antik Şehir Dedektifi',
                description: 'Sagalassos\'ta Roma\'yı hisset, "merdiven çok" deme! 🏛️',
                points: 150,
                duration: '4 saat',
                type: 'historical'
            },
            {
                id: 'salda',
                name: 'Mars Kaşifi',
                description: 'Salda Gölü\'nde yürü, "burası Mars mı?" de! 🏖️',
                points: 140,
                duration: '3 saat',
                type: 'nature'
            },
            {
                id: 'cebel',
                name: 'Teke Yörüğü',
                description: 'Cebel Yaylası\'nda kamp kur, keçilere selam ver! 🏕️',
                points: 130,
                duration: '5 saat',
                type: 'adventure'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Göl Çırağı',
                description: '3 aktivite tamamla, kumsalı gez!'
            },
            silver: {
                icon: '🥈',
                name: 'Yörük Beyi',
                description: '5 aktivite tamamla, çadırı kur!'
            },
            gold: {
                icon: '🥇',
                name: 'Burdur Beyi',
                description: 'Tüm aktiviteleri tamamla, turizm şirketi aç!'
            }
        }
    },
    canakkale: {
        id: 'canakkale',
        name: 'Çanakkale',
        region: 'marmara',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'troya',
                name: 'Truva Kahramanı',
                description: 'Truva Atı\'nın içine gir, "at değil bu müze!" de! 🐎',
                points: 150,
                duration: '3 saat',
                type: 'historical'
            },
            {
                id: 'gelibolu',
                name: 'Tarih Dedektifi',
                description: 'Gelibolu\'da şehitlikleri gez, saygı duruşunda bulun! 🌹',
                points: 160,
                duration: '4 saat',
                type: 'historical'
            },
            {
                id: 'bozcaada',
                name: 'Ada Kaşifi',
                description: 'Bozcaada\'da şarap tadımı yap, bağları say! 🍷',
                points: 140,
                duration: '6 saat',
                type: 'cultural'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Şehitlik Bekçisi',
                description: '3 aktivite tamamla, tarihe saygı duy!'
            },
            silver: {
                icon: '🥈',
                name: 'Truva Sipahisi',
                description: '5 aktivite tamamla, atı zaptet!'
            },
            gold: {
                icon: '🥇',
                name: 'Çanakkale Beyi',
                description: 'Tüm aktiviteleri tamamla, butik otel aç!'
            }
        }
    },
    denizli: {
        id: 'denizli',
        name: 'Denizli',
        region: 'ege',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'pamukkale',
                name: 'Travertenler Kaşifi',
                description: 'Pamukkale\'de yürü, "pamuk gibi" demeden durma! ⛰️',
                points: 160,
                duration: '4 saat',
                type: 'nature'
            },
            {
                id: 'horoz',
                name: 'Horoz Whisperer\'ı',
                description: 'Denizli horozunu dinle, "saat kaç?" diye sorma! 🐓',
                points: 120,
                duration: '1 saat',
                type: 'cultural'
            },
            {
                id: 'hierapolis',
                name: 'Antik Havuzcu',
                description: 'Kleopatra Havuzu\'nda yüz, "sütunlar gerçek mi?" diye sor! 🏊‍♂️',
                points: 150,
                duration: '3 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Dokuma Çırağı',
                description: '3 aktivite tamamla, ipleri boya!'
            },
            silver: {
                icon: '🥈',
                name: 'Travertenler Bekçisi',
                description: '5 aktivite tamamla, suları akıt!'
            },
            gold: {
                icon: '🥇',
                name: 'Denizli Beyi',
                description: 'Tüm aktiviteleri tamamla, tekstil fabrikası kur!'
            }
        }
    },
    duzce: {
        id: 'duzce',
        name: 'Düzce',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'findik',
                name: 'Fındık Dedektifi',
                description: 'Fındık topla, "bu ceviz mi?" deme! 🥜',
                points: 130,
                duration: '3 saat',
                type: 'nature'
            },
            {
                id: 'gumusova',
                name: 'Rafting Kahramanı',
                description: 'Melen Çayı\'nda rafting yap, küreği düşürme! 🛶',
                points: 160,
                duration: '4 saat',
                type: 'adventure'
            },
            {
                id: 'konuralp',
                name: 'Antik Gezgin',
                description: 'Konuralp Antik Tiyatro\'da poz ver, alkış bekle! 🏛️',
                points: 140,
                duration: '2 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Fındık Çırağı',
                description: '3 aktivite tamamla, dalları silk!'
            },
            silver: {
                icon: '🥈',
                name: 'Rafting Kaptanı',
                description: '5 aktivite tamamla, akıntıya karşı koy!'
            },
            gold: {
                icon: '🥇',
                name: 'Düzce Beyi',
                description: 'Tüm aktiviteleri tamamla, macera parkı aç!'
            }
        }
    },
    edirne: {
        id: 'edirne',
        name: 'Edirne',
        region: 'marmara',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'selimiye',
                name: 'Mimar Sinan Çırağı',
                description: 'Selimiye Camii\'ni gez, "bu kadar simetri fazla!" deme! 🕌',
                points: 150,
                duration: '3 saat',
                type: 'historical'
            },
            {
                id: 'tava',
                name: 'Tava Ciğeri Ustası',
                description: 'Edirne tava ciğeri ye, "çatal nerede?" deme! 🍖',
                points: 130,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'kirkpinar',
                name: 'Yağlı Pehlivan',
                description: 'Kırkpınar\'da güreş izle, "neden yağlılar?" diye sorma! 🤼',
                points: 140,
                duration: '4 saat',
                type: 'cultural'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Ciğer Çırağı',
                description: '3 aktivite tamamla, tavayı kızdır!'
            },
            silver: {
                icon: '🥈',
                name: 'Pehlivan Başı',
                description: '5 aktivite tamamla, kispeti giy!'
            },
            gold: {
                icon: '🥇',
                name: 'Edirne Beyi',
                description: 'Tüm aktiviteleri tamamla, ciğerci dükkanı aç!'
            }
        }
    },
    isparta: {
        id: 'isparta',
        name: 'Isparta',
        region: 'akdeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'gul',
                name: 'Gül Dedektifi',
                description: 'Gül bahçelerinde gez, "neden bu kadar güzel kokuyor?" deme! 🌹',
                points: 140,
                duration: '2 saat',
                type: 'nature'
            },
            {
                id: 'davraz',
                name: 'Kayak Virtüözü',
                description: 'Davraz\'da kayak yap, kardanadam yap! ⛷️',
                points: 160,
                duration: '4 saat',
                type: 'adventure'
            },
            {
                id: 'yalvac',
                name: 'Antik Şehir Kaşifi',
                description: 'Pisidia Antiocheia\'yı keşfet, Roma\'yı hisset! 🏛️',
                points: 150,
                duration: '3 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Gül Çırağı',
                description: '3 aktivite tamamla, gülyağı yap!'
            },
            silver: {
                icon: '🥈',
                name: 'Kar Kaptanı',
                description: '5 aktivite tamamla, zirveye çık!'
            },
            gold: {
                icon: '🥇',
                name: 'Isparta Beyi',
                description: 'Tüm aktiviteleri tamamla, gül bahçesi kur!'
            }
        }
    },
    karabuk: {
        id: 'karabuk',
        name: 'Karabük',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'safranbolu',
                name: 'Konak Gezgini',
                description: 'Safranbolu evlerini gez, "bu kapı neden bu kadar alçak?" deme! 🏠',
                points: 150,
                duration: '4 saat',
                type: 'historical'
            },
            {
                id: 'safran',
                name: 'Safran Avcısı',
                description: 'Safran tarlalarını gez, "bu neden bu kadar pahalı?" diye sor! 🌺',
                points: 140,
                duration: '2 saat',
                type: 'nature'
            },
            {
                id: 'lokum',
                name: 'Lokum Tadımcısı',
                description: 'Safranbolu lokumu ye, "bu normal lokum gibi" deme! 🍬',
                points: 120,
                duration: '1 saat',
                type: 'food'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Safran Çırağı',
                description: '3 aktivite tamamla, çiçekleri topla!'
            },
            silver: {
                icon: '🥈',
                name: 'Konak Bekçisi',
                description: '5 aktivite tamamla, tarihi yaşat!'
            },
            gold: {
                icon: '🥇',
                name: 'Karabük Beyi',
                description: 'Tüm aktiviteleri tamamla, butik otel aç!'
            }
        }
    },
    kayseri: {
        id: 'kayseri',
        name: 'Kayseri',
        region: 'ic_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'pastirma',
                name: 'Pastırma Ustası',
                description: 'Pastırma ye, "bu çok baharatlı" deme! 🥩',
                points: 130,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'erciyes',
                name: 'Dağ Fatihi',
                description: 'Erciyes\'te kayak yap, zirveden selam ver! ⛷️',
                points: 160,
                duration: '4 saat',
                type: 'adventure'
            },
            {
                id: 'manti',
                name: 'Mantı Virtüözü',
                description: 'Kayseri mantısı ye, "bu kadar küçük olur mu?" deme! 🥟',
                points: 140,
                duration: '2 saat',
                type: 'food'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Mantı Çırağı',
                description: '3 aktivite tamamla, hamuru aç!'
            },
            silver: {
                icon: '🥈',
                name: 'Erciyes Kartalı',
                description: '5 aktivite tamamla, pisti fethet!'
            },
            gold: {
                icon: '🥇',
                name: 'Kayseri Beyi',
                description: 'Tüm aktiviteleri tamamla, pastırma dükkanı aç!'
            }
        }
    },
    kirikkale: {
        id: 'kirikkale',
        name: 'Kırıkkale',
        region: 'ic_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'silah',
                name: 'Silah Ustası',
                description: 'MKE Silah Müzesi\'ni gez, "bunlar oyuncak mı?" deme! 🎯',
                points: 140,
                duration: '2 saat',
                type: 'cultural'
            },
            {
                id: 'kapulukaya',
                name: 'Baraj Kaşifi',
                description: 'Kapulukaya Barajı\'nda piknik yap, balıkları say! 🎣',
                points: 130,
                duration: '3 saat',
                type: 'nature'
            },
            {
                id: 'celtek',
                name: 'Kaplıca Avcısı',
                description: 'Çeltek Kaplıcaları\'nda yüz, "su çok sıcak" deme! 🌊',
                points: 150,
                duration: '4 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Sanayi Çırağı',
                description: '3 aktivite tamamla, çeliği döv!'
            },
            silver: {
                icon: '🥈',
                name: 'Baraj Bekçisi',
                description: '5 aktivite tamamla, suyu tut!'
            },
            gold: {
                icon: '🥇',
                name: 'Kırıkkale Beyi',
                description: 'Tüm aktiviteleri tamamla, fabrika kur!'
            }
        }
    },
    kirklareli: {
        id: 'kirklareli',
        name: 'Kırklareli',
        region: 'marmara',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'hardaliye',
                name: 'Hardaliye Tadımcısı',
                description: 'Hardaliye iç, "bu üzüm suyu mu?" deme! 🍷',
                points: 120,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'longoz',
                name: 'Orman Kaşifi',
                description: 'Longoz Ormanları\'nda yürü, su perilerine selam ver! 🌳',
                points: 150,
                duration: '4 saat',
                type: 'nature'
            },
            {
                id: 'dupnisa',
                name: 'Mağara Dedektifi',
                description: 'Dupnisa Mağarası\'nı keşfet, yarasalarla arkadaş ol! 🦇',
                points: 140,
                duration: '3 saat',
                type: 'adventure'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Peynir Çırağı',
                description: '3 aktivite tamamla, mandırayı öğren!'
            },
            silver: {
                icon: '🥈',
                name: 'Orman Bekçisi',
                description: '5 aktivite tamamla, ağaçları koru!'
            },
            gold: {
                icon: '🥇',
                name: 'Kırklareli Beyi',
                description: 'Tüm aktiviteleri tamamla, bağ evi aç!'
            }
        }
    },
    kocaeli: {
        id: 'kocaeli',
        name: 'Kocaeli',
        region: 'marmara',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'pismanic',
                name: 'Pişmaniye Ustası',
                description: 'Pişmaniye yap, "bu pamuk şeker mi?" deme! 🍬',
                points: 130,
                duration: '2 saat',
                type: 'food'
            },
            {
                id: 'kartepe',
                name: 'Kayak Virtüözü',
                description: 'Kartepe\'de kayak yap, İstanbul\'u selamla! ⛷️',
                points: 160,
                duration: '4 saat',
                type: 'adventure'
            },
            {
                id: 'seka',
                name: 'Kağıt Dedektifi',
                description: 'SEKA Kağıt Müzesi\'ni gez, ağaçlara teşekkür et! 📜',
                points: 140,
                duration: '2 saat',
                type: 'cultural'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Sanayi Çırağı',
                description: '3 aktivite tamamla, fabrikayı öğren!'
            },
            silver: {
                icon: '🥈',
                name: 'Kar Kaptanı',
                description: '5 aktivite tamamla, zirveye çık!'
            },
            gold: {
                icon: '🥇',
                name: 'Kocaeli Beyi',
                description: 'Tüm aktiviteleri tamamla, pişmaniye fabrikası kur!'
            }
        }
    },
    konya: {
        id: 'konya',
        name: 'Konya',
        region: 'ic_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'mevlana',
                name: 'Sema Ustası',
                description: 'Mevlana Müzesi\'nde sema izle, başın dönmesin! 🕌',
                points: 160,
                duration: '3 saat',
                type: 'cultural'
            },
            {
                id: 'etliekmek',
                name: 'Etliekmek Virtüözü',
                description: 'Etliekmek ye, "bu lahmacun mu?" deme! 🥙',
                points: 130,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'catalhoyuk',
                name: 'Neolitik Dedektifi',
                description: 'Çatalhöyük\'te kazı yap, "bu sadece toprak yığını mı?" deme! 🏺',
                points: 150,
                duration: '4 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Derviş Çırağı',
                description: '3 aktivite tamamla, sema öğren!'
            },
            silver: {
                icon: '🥈',
                name: 'Selçuklu Sipahisi',
                description: '5 aktivite tamamla, tarihi yaşa!'
            },
            gold: {
                icon: '🥇',
                name: 'Konya Beyi',
                description: 'Tüm aktiviteleri tamamla, lokanta aç!'
            }
        }
    },
    mersin: {
        id: 'mersin',
        name: 'Mersin',
        region: 'akdeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'cennet',
                name: 'Mağara Kaşifi',
                description: 'Cennet-Cehennem Mağaraları\'nı gez, merdivenlerden korkma! 🏔️',
                points: 150,
                duration: '3 saat',
                type: 'nature'
            },
            {
                id: 'tantuni',
                name: 'Tantuni Ustası',
                description: 'Tantuni ye, "bu dürüm mü?" deme! 🌯',
                points: 120,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'kizkalesi',
                name: 'Deniz Kahramanı',
                description: 'Kızkalesi\'ne yüz, efsaneyi dinle! 🏰',
                points: 140,
                duration: '2 saat',
                type: 'adventure'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Narenciye Çırağı',
                description: '3 aktivite tamamla, portakal topla!'
            },
            silver: {
                icon: '🥈',
                name: 'Deniz Kaptanı',
                description: '5 aktivite tamamla, dalgalarla dans et!'
            },
            gold: {
                icon: '🥇',
                name: 'Mersin Beyi',
                description: 'Tüm aktiviteleri tamamla, tantuni dükkanı aç!'
            }
        }
    },
    mugla: {
        id: 'mugla',
        name: 'Muğla',
        region: 'ege',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'oludeniz',
                name: 'Yamaç Paraşütü Pilotu',
                description: 'Ölüdeniz\'de paraşütle uç, "çok yüksek!" deme! 🪂',
                points: 180,
                duration: '3 saat',
                type: 'adventure'
            },
            {
                id: 'bodrum',
                name: 'Kale Fatihi',
                description: 'Bodrum Kalesi\'ni gez, sualtı müzesinde balıklarla tanış! 🏰',
                points: 150,
                duration: '4 saat',
                type: 'historical'
            },
            {
                id: 'datca',
                name: 'Badem Dedektifi',
                description: 'Datça\'da badem topla, "bu fıstık mı?" deme! 🥜',
                points: 130,
                duration: '2 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Deniz Çırağı',
                description: '3 aktivite tamamla, tekneyi hazırla!'
            },
            silver: {
                icon: '🥈',
                name: 'Mavi Yolcu',
                description: '5 aktivite tamamla, koyları keşfet!'
            },
            gold: {
                icon: '🥇',
                name: 'Muğla Beyi',
                description: 'Tüm aktiviteleri tamamla, butik otel aç!'
            }
        }
    },
    sakarya: {
        id: 'sakarya',
        name: 'Sakarya',
        region: 'marmara',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'ıslama',
                name: 'Islama Ustası',
                description: 'Adapazarı ıslama köftesi ye, "bu normal tost mu?" deme! 🥪',
                points: 130,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'sapanca',
                name: 'Göl Kaşifi',
                description: 'Sapanca Gölü\'nde tekne turu yap, martıları besle! ⛵',
                points: 140,
                duration: '3 saat',
                type: 'nature'
            },
            {
                id: 'karasu',
                name: 'Plaj Virtüözü',
                description: 'Karasu\'da denize gir, "Karadeniz soğuk!" deme! 🏖️',
                points: 150,
                duration: '4 saat',
                type: 'adventure'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Köfte Çırağı',
                description: '3 aktivite tamamla, ekmeği ısla!'
            },
            silver: {
                icon: '🥈',
                name: 'Göl Kaptanı',
                description: '5 aktivite tamamla, kıyıları keşfet!'
            },
            gold: {
                icon: '🥇',
                name: 'Sakarya Beyi',
                description: 'Tüm aktiviteleri tamamla, restoran aç!'
            }
        }
    },
    tekirdag: {
        id: 'tekirdag',
        name: 'Tekirdağ',
        region: 'marmara',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'kofte',
                name: 'Köfte Dedektifi',
                description: 'Tekirdağ köftesi ye, "bu normal köfte!" deme! 🍖',
                points: 130,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'rakı',
                name: 'Rakı Filozofu',
                description: 'Rakı Müzesi\'ni gez, "bu su mu?" deme! 🥂',
                points: 140,
                duration: '2 saat',
                type: 'cultural'
            },
            {
                id: 'kiyi',
                name: 'Sahil Gezgini',
                description: 'Kıyı şeridinde yürü, İstanbul\'u selamla! 🌅',
                points: 120,
                duration: '3 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Köfte Çırağı',
                description: '3 aktivite tamamla, eti yoğur!'
            },
            silver: {
                icon: '🥈',
                name: 'Sahil Bekçisi',
                description: '5 aktivite tamamla, dalgaları say!'
            },
            gold: {
                icon: '🥇',
                name: 'Tekirdağ Beyi',
                description: 'Tüm aktiviteleri tamamla, köfteci aç!'
            }
        }
    },
    yalova: {
        id: 'yalova',
        name: 'Yalova',
        region: 'marmara',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'termal',
                name: 'Kaplıca Kaşifi',
                description: 'Termal\'de kaplıcaya gir, "su çok sıcak!" deme! ♨️',
                points: 150,
                duration: '3 saat',
                type: 'nature'
            },
            {
                id: 'yuruyen',
                name: 'Ağaç Dedektifi',
                description: 'Yürüyen Köşk\'ü gez, ağaca saygı duy! 🌳',
                points: 130,
                duration: '2 saat',
                type: 'historical'
            },
            {
                id: 'cicek',
                name: 'Çiçek Virtüözü',
                description: 'Çiçek seralarını gez, "bunlar plastik mi?" deme! 🌸',
                points: 140,
                duration: '2 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Termal Çırağı',
                description: '3 aktivite tamamla, suyu test et!'
            },
            silver: {
                icon: '🥈',
                name: 'Bahçıvan Ustası',
                description: '5 aktivite tamamla, çiçekleri sula!'
            },
            gold: {
                icon: '🥇',
                name: 'Yalova Beyi',
                description: 'Tüm aktiviteleri tamamla, sera kur!'
            }
        }
    },
    zonguldak: {
        id: 'zonguldak',
        name: 'Zonguldak',
        region: 'karadeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'maden',
                name: 'Maden Kaşifi',
                description: 'Maden Müzesi\'ni gez, "kömür neden siyah?" deme! ⛏️',
                points: 150,
                duration: '3 saat',
                type: 'cultural'
            },
            {
                id: 'gokgol',
                name: 'Mağara Dedektifi',
                description: 'Gökgöl Mağarası\'nı keşfet, sarkıtları say! 🦇',
                points: 140,
                duration: '2 saat',
                type: 'nature'
            },
            {
                id: 'karadeniz',
                name: 'Balık Ustası',
                description: 'Karadeniz\'de balık tut, "hamsi nerede?" deme! 🐟',
                points: 130,
                duration: '4 saat',
                type: 'adventure'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Madenci Çırağı',
                description: '3 aktivite tamamla, kazmayı tut!'
            },
            silver: {
                icon: '🥈',
                name: 'Ocak Bekçisi',
                description: '5 aktivite tamamla, kömürü çıkar!'
            },
            gold: {
                icon: '🥇',
                name: 'Zonguldak Beyi',
                description: 'Tüm aktiviteleri tamamla, maden müzesi aç!'
            }
        }
    },
    tunceli: {
        id: 'tunceli',
        name: 'Tunceli',
        region: 'dogu_anadolu',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'munzur',
                name: 'Rafting Kahramanı',
                description: 'Munzur Vadisi\'nde rafting yap, suya kapılma! 🛶',
                points: 160,
                duration: '4 saat',
                type: 'adventure'
            },
            {
                id: 'kelek',
                name: 'Kelek Ustası',
                description: 'Geleneksel kelek yapımını öğren, "bu sal mı?" deme! 🛟',
                points: 140,
                duration: '3 saat',
                type: 'cultural'
            },
            {
                id: 'pertek',
                name: 'Kale Dedektifi',
                description: 'Pertek Kalesi\'ni gez, baraj gölünde yüzen kaleyi bul! 🏰',
                points: 150,
                duration: '3 saat',
                type: 'historical'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Dağ Çırağı',
                description: '3 aktivite tamamla, vadileri keşfet!'
            },
            silver: {
                icon: '🥈',
                name: 'Munzur Bekçisi',
                description: '5 aktivite tamamla, doğayı koru!'
            },
            gold: {
                icon: '🥇',
                name: 'Tunceli Beyi',
                description: 'Tüm aktiviteleri tamamla, rafting merkezi kur!'
            }
        }
    },
    hatay: {
        id: 'hatay',
        name: 'Hatay',
        region: 'akdeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'kunefe',
                name: 'Künefe Ustası',
                description: 'Künefe ye, "peynir neden tuzlu?" deme! 🧀',
                points: 130,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'mozaik',
                name: 'Mozaik Dedektifi',
                description: 'Antakya Mozaik Müzesi\'ni gez, desenleri say! 🎨',
                points: 150,
                duration: '3 saat',
                type: 'historical'
            },
            {
                id: 'harbiye',
                name: 'Şelale Kaşifi',
                description: 'Harbiye Şelaleleri\'nde yürü, su perilerini ara! 💦',
                points: 140,
                duration: '2 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Künefe Çırağı',
                description: '3 aktivite tamamla, peyniri ser!'
            },
            silver: {
                icon: '🥈',
                name: 'Mozaik Ustası',
                description: '5 aktivite tamamla, taşları diz!'
            },
            gold: {
                icon: '🥇',
                name: 'Hatay Beyi',
                description: 'Tüm aktiviteleri tamamla, künefe salonu aç!'
            }
        }
    },
    kahramanmaras: {
        id: 'kahramanmaras',
        name: 'Kahramanmaraş',
        region: 'akdeniz',
        imageUrl: 'https://images.unsplash.com/photo-1599472492874-c2e26ed2f0b7?w=800&q=80',
        activities: [
            {
                id: 'dondurma',
                name: 'Dondurma Virtüözü',
                description: 'Maraş dondurması ye, "neden çatal bıçakla?" deme! 🍦',
                points: 130,
                duration: '1 saat',
                type: 'food'
            },
            {
                id: 'kale',
                name: 'Kale Fatihi',
                description: 'Maraş Kalesi\'ne tırman, şehri selamla! 🏰',
                points: 150,
                duration: '3 saat',
                type: 'historical'
            },
            {
                id: 'biber',
                name: 'Biber Ustası',
                description: 'Maraş biberi topla, "çok acı!" deme! 🌶️',
                points: 140,
                duration: '2 saat',
                type: 'nature'
            }
        ],
        badges: {
            bronze: {
                icon: '🥉',
                name: 'Dondurma Çırağı',
                description: '3 aktivite tamamla, kepçeyi döndür!'
            },
            silver: {
                icon: '🥈',
                name: 'Baharat Ustası',
                description: '5 aktivite tamamla, biberi öğüt!'
            },
            gold: {
                icon: '🥇',
                name: 'Maraş Beyi',
                description: 'Tüm aktiviteleri tamamla, dondurma dükkanı aç!'
            }
        }
    }
};

// Verileri Firestore'a ekle
export const seedCityData = async () => {
    try {
        const db = getFirebaseDb();
        const citiesRef = collection(db, 'cities');

        // Her şehir için veri ekle
        for (const [cityId, cityInfo] of Object.entries(cityData)) {
            await setDoc(doc(citiesRef, cityId), cityInfo);
        }
        return true;
    } catch (error) {
        console.error('Veri ekleme hatası:', error);
        return false;
    }
};

// Veri sayısını ve şehir isimlerini hesapla
const cityCount = Object.keys(cityData).length;
const cityNames = Object.values(cityData).map(city => city.name).sort();

// Export the data
export const seedData = {
    cities: cityData,
    cityCount,
    cityNames
}; 