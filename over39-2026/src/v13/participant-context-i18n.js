// Direct participant-facing copy for the additive cultural-arts context.
// IDs remain stable in participant-context.js; this table never changes R01–R20.
const base = {
  ko: {
    title: "이번 답변이 닿는 문화예술 활동의 맥락을 알려주세요.",
    help: "기존 역할과 별도로 분야와 활동 형태를 함께 남깁니다. 이 선택은 전문성의 등급이나 자격을 뜻하지 않습니다.",
    field: "어떤 문화예술 분야와 가장 가까운가요?", mode: "그 분야와 현재 어떤 방식으로 관계하고 있나요?", form: "현재 이 활동은 생활 안에서 어떤 형태로 이어지고 있나요?", unit: "이번 답변은 누구의 경험을 중심으로 하나요?",
    fieldOther: "가까운 분야를 직접 적어주세요.", modeOther: "현재의 관계 방식을 직접 적어주세요.", unitOther: "이번 답변의 중심을 직접 적어주세요.",
  },
  en: {
    title: "Tell us about the arts-and-culture context of this response.",
    help: "Alongside any existing role, this records the field and form of your activity. It does not rank professional status or eligibility.",
    field: "Which arts-and-culture fields are closest to you?", mode: "How are you currently involved in that field?", form: "How does this activity currently continue within your life?", unit: "Whose experience is at the centre of this response?",
    fieldOther: "Please name the field in your own words.", modeOther: "Please describe your way of being involved.", unitOther: "Please describe the centre of this response.",
  },
  ja: {
    title: "今回の回答につながる文化芸術活動の背景を教えてください。", help: "これまでの役割とは別に、分野と活動の形を記録します。専門性の等級や参加資格を示すものではありません。",
    field: "最も近い文化芸術の分野はどれですか？", mode: "現在、その分野とどのように関わっていますか？", form: "この活動は今、生活の中でどのような形で続いていますか？", unit: "今回の回答は、誰の経験を中心にしていますか？",
    fieldOther: "近い分野を自由に書いてください。", modeOther: "関わり方を自由に書いてください。", unitOther: "回答の中心を自由に書いてください。",
  },
  "zh-Hans": {
    title: "请告诉我们这份回答所涉及的文化艺术活动背景。", help: "除已有角色外，这里记录领域与活动形式；它不表示专业等级或参与资格。",
    field: "您最接近哪些文化艺术领域？", mode: "您目前以什么方式与该领域保持联系？", form: "这项活动目前以什么形式在您的生活中延续？", unit: "这次回答主要围绕谁的经验？",
    fieldOther: "请用自己的话写下相关领域。", modeOther: "请用自己的话说明参与方式。", unitOther: "请说明这次回答的中心。",
  },
  "zh-Hant": {
    title: "請告訴我們這份回答所涉及的文化藝術活動背景。", help: "除既有角色外，這裡記錄領域與活動形式；它不表示專業等級或參與資格。",
    field: "您最接近哪些文化藝術領域？", mode: "您目前以什麼方式與該領域保持聯繫？", form: "這項活動目前以什麼形式在您的生活中延續？", unit: "這次回答主要圍繞誰的經驗？",
    fieldOther: "請用自己的話寫下相關領域。", modeOther: "請用自己的話說明參與方式。", unitOther: "請說明這次回答的中心。",
  },
  fr: {
    title: "Situez le contexte culturel et artistique de cette réponse.", help: "En plus du rôle déjà indiqué, cette étape note le domaine et la forme de l’activité. Elle ne classe ni le niveau professionnel ni l’éligibilité.",
    field: "Quels domaines artistiques et culturels vous sont les plus proches ?", mode: "Comment êtes-vous actuellement lié·e à ce domaine ?", form: "Sous quelle forme cette activité se poursuit-elle aujourd’hui dans votre vie ?", unit: "Quelle expérience est au centre de cette réponse ?",
    fieldOther: "Indiquez le domaine avec vos propres mots.", modeOther: "Décrivez votre manière de participer.", unitOther: "Précisez le centre de cette réponse.",
  },
  es: {
    title: "Cuéntenos el contexto cultural y artístico de esta respuesta.", help: "Junto al rol ya indicado, aquí se registra el ámbito y la forma de la actividad. No clasifica el nivel profesional ni la elegibilidad.",
    field: "¿Qué ámbitos de las artes y la cultura le resultan más cercanos?", mode: "¿Cómo se relaciona actualmente con ese ámbito?", form: "¿De qué forma continúa hoy esta actividad en su vida?", unit: "¿La experiencia de quién está en el centro de esta respuesta?",
    fieldOther: "Nombre el ámbito con sus propias palabras.", modeOther: "Describa su forma de participación.", unitOther: "Describa el centro de esta respuesta.",
  },
  nl: {
    title: "Vertel iets over de kunst- en cultuurcontext van dit antwoord.", help: "Naast de al gekozen rol leggen we hier het vakgebied en de vorm van de activiteit vast. Dit zegt niets over professionele rang of toelating.",
    field: "Welke kunst- en cultuurgebieden staan het dichtst bij u?", mode: "Hoe bent u momenteel bij dat gebied betrokken?", form: "In welke vorm loopt deze activiteit nu door in uw leven?", unit: "Wiens ervaring staat centraal in dit antwoord?",
    fieldOther: "Noem het gebied in uw eigen woorden.", modeOther: "Beschrijf uw manier van betrokken zijn.", unitOther: "Beschrijf wat centraal staat in dit antwoord.",
  },
  ms: {
    title: "Ceritakan konteks seni dan budaya bagi respons ini.", help: "Di samping peranan sedia ada, langkah ini merekod bidang dan bentuk kegiatan. Ia bukan penilaian tahap profesional atau kelayakan.",
    field: "Bidang seni dan budaya manakah yang paling dekat dengan anda?", mode: "Bagaimanakah anda kini berkait dengan bidang itu?", form: "Dalam bentuk apakah kegiatan ini diteruskan dalam kehidupan anda sekarang?", unit: "Pengalaman siapakah yang menjadi tumpuan respons ini?",
    fieldOther: "Nyatakan bidang itu dengan kata-kata sendiri.", modeOther: "Terangkan cara anda terlibat.", unitOther: "Terangkan tumpuan respons ini.",
  },
};

const labels = {
  ko: [
    ["시각예술","사진·영상·미디어","공예·디자인","영화","연극·공연","무용","음악","전통예술·전통문화","문학·출판","문화유산·기록","다원·융복합","지역·생활문화","기타 직접 입력"],
    ["창작·제작","연출·안무·작곡·구성","공연·연주·실연","기획·프로듀싱","교육·전승·강습","비평·연구","기록·아카이브","편집·출판·미디어","기술·제작지원","공간·기관 운영","유통·후원","배우거나 수련하는 중","취미·동호회·생활예술","지역·공동체 활동","기타 직접 입력"],
    ["주된 일로 이어가고 있다","다른 일과 함께 이어가고 있다","프로젝트가 있을 때 유급으로 한다","교육·강습과 함께 이어간다","무급·자원활동·공동체 활동으로 한다","취미·동호회 활동으로 이어간다","배우거나 수련하고 있다","현재 쉬거나 속도를 조절하고 있다","이전과 다른 역할로 이동했다","한 가지로 말하기 어렵다"],
    ["나 개인의 활동","내가 속한 팀·그룹의 활동","개인과 팀을 함께","다른 형태 — 직접 입력"],
  ],
  en: [
    ["Visual arts","Photography, moving image, and media","Craft and design","Film","Theatre and performance","Dance","Music","Traditional arts and culture","Literature and publishing","Cultural heritage and archives","Interdisciplinary practice","Local and everyday culture","Other — describe it"],
    ["Creating and making","Directing, choreography, composition, or shaping","Performing, playing, or live presentation","Planning and producing","Teaching, transmission, or instruction","Criticism and research","Documentation and archives","Editing, publishing, and media","Technical and production support","Operating a space or institution","Distribution and patronage","Learning or training","Hobby, club, or everyday arts","Local or community activity","Other — describe it"],
    ["It continues as my main work","It continues alongside other work","I am paid when there is a project","It continues with teaching or instruction","I do it as unpaid, voluntary, or community activity","It continues as a hobby or club activity","I am learning or training","I am resting or adjusting the pace","I have moved into a different role","It is hard to describe in one way"],
    ["My individual activity","A team or group I belong to","Both my individual and team activity","Another form — describe it"],
  ],
  ja: [
    ["視覚芸術","写真・映像・メディア","工芸・デザイン","映画","演劇・パフォーマンス","ダンス","音楽","伝統芸術・伝統文化","文学・出版","文化遺産・記録","分野横断・複合","地域・生活文化","その他（自由記入）"],
    ["創作・制作","演出・振付・作曲・構成","上演・演奏・実演","企画・プロデュース","教育・継承・指導","批評・研究","記録・アーカイブ","編集・出版・メディア","技術・制作支援","空間・機関の運営","流通・支援","学び・稽古の途中","趣味・サークル・生活芸術","地域・コミュニティ活動","その他（自由記入）"],
    ["主な仕事として続けている","別の仕事とともに続けている","プロジェクトがある時に有償で行う","教育・指導とともに続けている","無償・ボランティア・共同体活動として行う","趣味・サークル活動として続けている","学び・稽古をしている","今は休む・ペースを調整している","以前と異なる役割へ移った","一つでは言いにくい"],
    ["自分個人の活動","所属するチーム・グループの活動","個人とチームの両方","別の形（自由記入）"],
  ],
  "zh-Hans": [
    ["视觉艺术","摄影、影像与媒体","工艺与设计","电影","戏剧与表演","舞蹈","音乐","传统艺术与传统文化","文学与出版","文化遗产与档案","跨学科与综合实践","地方与日常文化","其他（请说明）"],
    ["创作与制作","导演、编舞、作曲或构成","表演、演奏或现场呈现","策划与制作统筹","教育、传承或教学","评论与研究","记录与档案","编辑、出版与媒体","技术与制作支持","空间或机构运营","传播与赞助","学习或训练中","兴趣、社团或日常艺术","地方或社区活动","其他（请说明）"],
    ["作为主要工作持续进行","与其他工作一起持续进行","有项目时获得报酬","与教学或授课一起持续","作为无偿、志愿或社区活动","作为兴趣或社团活动持续","正在学习或训练","目前休息或调整节奏","转向了不同角色","难以用一种方式概括"],
    ["我个人的活动","我所属团队或小组的活动","个人与团队活动兼有","其他形式（请说明）"],
  ],
  "zh-Hant": [
    ["視覺藝術","攝影、影像與媒體","工藝與設計","電影","戲劇與表演","舞蹈","音樂","傳統藝術與傳統文化","文學與出版","文化遺產與檔案","跨領域與綜合實踐","地方與日常文化","其他（請說明）"],
    ["創作與製作","導演、編舞、作曲或構成","表演、演奏或現場呈現","策劃與製作統籌","教育、傳承或教學","評論與研究","記錄與檔案","編輯、出版與媒體","技術與製作支援","空間或機構營運","傳播與贊助","學習或訓練中","興趣、社團或日常藝術","地方或社群活動","其他（請說明）"],
    ["作為主要工作持續進行","與其他工作一起持續進行","有專案時獲得報酬","與教學或授課一起持續","作為無償、志願或社群活動","作為興趣或社團活動持續","正在學習或訓練","目前休息或調整節奏","轉向不同角色","難以用一種方式概括"],
    ["我個人的活動","我所屬團隊或小組的活動","個人與團隊活動兼有","其他形式（請說明）"],
  ],
  fr: [
    ["Arts visuels","Photographie, image animée et médias","Artisanat et design","Cinéma","Théâtre et performance","Danse","Musique","Arts et cultures traditionnels","Littérature et édition","Patrimoine culturel et archives","Pratiques interdisciplinaires","Culture locale et quotidienne","Autre — précisez"],
    ["Création et fabrication","Mise en scène, chorégraphie, composition ou conception","Interprétation, jeu ou présentation en direct","Conception et production","Enseignement, transmission ou cours","Critique et recherche","Documentation et archives","Édition, publication et médias","Soutien technique et de production","Gestion d’un lieu ou d’une institution","Diffusion et mécénat","Apprentissage ou formation","Loisir, club ou pratique artistique quotidienne","Activité locale ou communautaire","Autre — précisez"],
    ["C’est mon activité principale","Je la poursuis avec un autre travail","Je suis rémunéré·e lorsqu’il y a un projet","Elle se poursuit avec l’enseignement","Je la fais bénévolement ou dans une communauté","Elle continue comme loisir ou activité de club","Je suis en apprentissage ou en formation","Je fais une pause ou ajuste le rythme","J’ai changé de rôle","Il est difficile de le dire d’une seule manière"],
    ["Mon activité individuelle","L’activité d’une équipe ou d’un groupe auquel j’appartiens","Mon activité individuelle et celle d’une équipe","Une autre forme — précisez"],
  ],
  es: [
    ["Artes visuales","Fotografía, imagen en movimiento y medios","Artesanía y diseño","Cine","Teatro y performance","Danza","Música","Artes y culturas tradicionales","Literatura y edición","Patrimonio cultural y archivo","Prácticas interdisciplinarias","Cultura local y cotidiana","Otro — describa"],
    ["Creación y producción","Dirección, coreografía, composición o construcción","Interpretación, ejecución o presentación en vivo","Planificación y producción","Educación, transmisión o enseñanza","Crítica e investigación","Documentación y archivo","Edición, publicación y medios","Apoyo técnico y de producción","Gestión de un espacio o institución","Distribución y apoyo","Aprendizaje o formación","Afición, club o artes cotidianas","Actividad local o comunitaria","Otro — describa"],
    ["Continúa como mi trabajo principal","Continúa junto a otro trabajo","Recibo pago cuando hay un proyecto","Continúa junto con la enseñanza","La hago como actividad voluntaria o comunitaria","Continúa como afición o actividad de club","Estoy aprendiendo o en formación","Estoy descansando o ajustando el ritmo","He pasado a otro rol","Es difícil decirlo de una sola manera"],
    ["Mi actividad individual","La actividad de un equipo o grupo al que pertenezco","Mi actividad individual y la de un equipo","Otra forma — describa"],
  ],
  nl: [
    ["Beeldende kunst","Fotografie, bewegend beeld en media","Ambacht en ontwerp","Film","Theater en performance","Dans","Muziek","Traditionele kunst en cultuur","Literatuur en uitgeverij","Cultureel erfgoed en archief","Interdisciplinaire praktijk","Lokale en alledaagse cultuur","Anders — licht toe"],
    ["Maken en produceren","Regie, choreografie, compositie of vormgeving","Optreden, spelen of live presenteren","Plannen en produceren","Onderwijs, overdracht of lesgeven","Kritiek en onderzoek","Documentatie en archief","Redactie, publicatie en media","Technische en productiesteun","Een ruimte of instelling runnen","Distributie en ondersteuning","Leren of trainen","Hobby, club of alledaagse kunst","Lokale of gemeenschapsactiviteit","Anders — licht toe"],
    ["Het loopt door als mijn hoofdwerk","Het loopt door naast ander werk","Ik word betaald wanneer er een project is","Het loopt door samen met lesgeven","Ik doe het onbetaald, vrijwillig of in de gemeenschap","Het loopt door als hobby of clubactiviteit","Ik leer of train momenteel","Ik rust of pas het tempo aan","Ik ben naar een andere rol gegaan","Het is moeilijk in één vorm te zeggen"],
    ["Mijn eigen activiteit","De activiteit van een team of groep waartoe ik behoor","Mijn eigen en teamactiviteit samen","Een andere vorm — licht toe"],
  ],
  ms: [
    ["Seni visual","Fotografi, imej bergerak dan media","Kraf dan reka bentuk","Filem","Teater dan persembahan","Tarian","Muzik","Seni dan budaya tradisional","Sastera dan penerbitan","Warisan budaya dan arkib","Amalan antara disiplin","Budaya setempat dan kehidupan harian","Lain-lain — jelaskan"],
    ["Penciptaan dan penghasilan","Pengarahan, koreografi, gubahan atau pembentukan","Persembahan, permainan atau penyampaian langsung","Perancangan dan penerbitan","Pendidikan, pewarisan atau pengajaran","Kritikan dan penyelidikan","Dokumentasi dan arkib","Penyuntingan, penerbitan dan media","Sokongan teknikal dan produksi","Mengendalikan ruang atau institusi","Pengedaran dan sokongan","Belajar atau berlatih","Hobi, kelab atau seni kehidupan harian","Kegiatan setempat atau komuniti","Lain-lain — jelaskan"],
    ["Diteruskan sebagai kerja utama saya","Diteruskan bersama kerja lain","Saya dibayar apabila ada projek","Diteruskan bersama pengajaran","Saya melakukannya sebagai kegiatan sukarela atau komuniti","Diteruskan sebagai hobi atau kegiatan kelab","Saya sedang belajar atau berlatih","Saya sedang berehat atau melaras rentak","Saya berpindah ke peranan lain","Sukar dihuraikan dengan satu cara"],
    ["Kegiatan saya sebagai individu","Kegiatan pasukan atau kumpulan yang saya sertai","Kegiatan individu dan pasukan bersama","Bentuk lain — jelaskan"],
  ],
};

export function participantContextCopy(language = "ko") { return base[language] || base.en; }
export function participantContextLabels(language = "ko") { return labels[language] || labels.en; }

// P05 keeps its original duration codes. Only the participant-facing entry
// sentence changes so no one has to describe a long-term cultural practice as
// a job title in order to answer it.
const activityScreenCopy = {
  ko: {
    headingAudience: "문화예술을 찾아보고 참여해 온 방식을 알려주세요.", headingOther: "현재의 활동과 상태를 알려주세요.",
    p05Audience: "문화예술을 스스로 찾아보거나 전시·프로그램에 참여하기 시작한 지 얼마나 되었나요?", p05Other: "지금 말한 문화예술 활동을 시작한 지 얼마나 되었나요?", yearLabel: "기억한다면 시작 연도를 적어주세요.", yearPlaceholder: "예: 2008",
  },
  en: {
    headingAudience: "Tell us how you have sought out and taken part in arts and culture.", headingOther: "Tell us about your current activity and its situation.",
    p05Audience: "How long has it been since you began seeking out arts and culture or taking part in programmes?", p05Other: "How long has it been since you began the arts-and-culture activity you have just described?", yearLabel: "If you remember, enter the year you began.", yearPlaceholder: "For example, 2008",
  },
  ja: {
    headingAudience: "文化芸術を探し、参加してきた方法を教えてください。", headingOther: "現在の活動と状態を教えてください。",
    p05Audience: "文化芸術を自分で探したり、プログラムに参加し始めてからどのくらいですか？", p05Other: "今話している文化芸術活動を始めてから、どのくらいですか？", yearLabel: "覚えていれば、始めた年を入力してください。", yearPlaceholder: "例：2008",
  },
  "zh-Hans": {
    headingAudience: "请告诉我们您如何寻找并参与文化艺术。", headingOther: "请告诉我们您目前的活动与状态。",
    p05Audience: "您开始主动接触文化艺术或参与相关活动至今有多久？", p05Other: "您开始刚才所说的文化艺术活动至今有多久？", yearLabel: "如果记得，请填写开始的年份。", yearPlaceholder: "例如：2008",
  },
  "zh-Hant": {
    headingAudience: "請告訴我們您如何尋找並參與文化藝術。", headingOther: "請告訴我們您目前的活動與狀態。",
    p05Audience: "您開始主動接觸文化藝術或參與相關活動至今有多久？", p05Other: "您開始剛才所說的文化藝術活動至今有多久？", yearLabel: "如果記得，請填寫開始的年份。", yearPlaceholder: "例如：2008",
  },
  fr: {
    headingAudience: "Racontez comment vous avez cherché et rejoint les arts et la culture.", headingOther: "Racontez votre activité actuelle et sa situation.",
    p05Audience: "Depuis combien de temps cherchez-vous les arts et la culture ou participez-vous à des activités ?", p05Other: "Depuis combien de temps avez-vous commencé l’activité culturelle ou artistique dont vous venez de parler ?", yearLabel: "Si vous vous en souvenez, indiquez l’année de début.", yearPlaceholder: "Par exemple : 2008",
  },
  es: {
    headingAudience: "Cuéntenos cómo ha buscado y participado en las artes y la cultura.", headingOther: "Cuéntenos sobre su actividad actual y su situación.",
    p05Audience: "¿Desde hace cuánto busca artes y cultura o participa en actividades?", p05Other: "¿Desde hace cuánto comenzó la actividad cultural o artística de la que acaba de hablar?", yearLabel: "Si lo recuerda, indique el año en que comenzó.", yearPlaceholder: "Por ejemplo: 2008",
  },
  nl: {
    headingAudience: "Vertel hoe u kunst en cultuur hebt opgezocht en eraan hebt deelgenomen.", headingOther: "Vertel over uw huidige activiteit en situatie.",
    p05Audience: "Hoe lang zoekt u al kunst en cultuur op of neemt u deel aan activiteiten?", p05Other: "Hoe lang geleden bent u begonnen met de kunst- of cultuuractiviteit waarover u zojuist vertelde?", yearLabel: "Vul het beginjaar in als u het zich herinnert.", yearPlaceholder: "Bijvoorbeeld: 2008",
  },
  ms: {
    headingAudience: "Ceritakan cara anda mencari dan menyertai seni dan budaya.", headingOther: "Ceritakan kegiatan dan keadaan anda sekarang.",
    p05Audience: "Sudah berapa lama anda mencari seni dan budaya atau menyertai kegiatan?", p05Other: "Sudah berapa lama anda memulakan kegiatan seni dan budaya yang baru anda ceritakan?", yearLabel: "Jika anda ingat, masukkan tahun anda bermula.", yearPlaceholder: "Contohnya: 2008",
  },
};

export function participantActivityScreenCopy(language = "ko") { return activityScreenCopy[language] || activityScreenCopy.en; }

// These are small participant-facing prompts, not a new D-axis or a new
// scoring table. They give a concrete, field-aware way into the existing D
// questions while leaving D1–D4 and their stored values unchanged.
const dContextHintCopy = {
  ko: {
    everyday: ["퇴근 뒤 시간과 회비", "수업·연습 공간", "동료와 지도자"],
    dance: ["몸·부상·회복", "리허설과 연습 공간", "공연 계약과 시간"],
    theatre: ["오디션과 연습시간", "생계와 공연장", "동료와 관계"],
    music: ["연습과 악기", "전승·배움과 제자", "공연과 지역 기반"],
    film: ["제작비와 스태프", "후반작업", "배급·상영의 기회"],
    general: ["생활과 시간", "공간과 비용", "관계와 운영 조건"],
  },
  en: {
    everyday: ["time after work and membership costs", "class or practice space", "peers and teachers"],
    dance: ["the body, injury, and recovery", "rehearsal and practice space", "performance contracts and time"],
    theatre: ["auditions and rehearsal time", "livelihood and venues", "peers and relationships"],
    music: ["practice and instruments", "transmission, learning, and students", "performance and local grounding"],
    film: ["production budgets and crew", "post-production", "distribution and screening opportunities"],
    general: ["daily life and time", "space and cost", "relationships and operating conditions"],
  },
  ja: {
    everyday: ["仕事後の時間と会費", "授業・練習の場所", "仲間と指導者"], dance: ["身体・けが・回復", "リハーサルと練習場所", "公演契約と時間"], theatre: ["オーディションと稽古時間", "生計と会場", "仲間と関係"], music: ["練習と楽器", "継承・学び・弟子", "公演と地域の基盤"], film: ["制作費とスタッフ", "ポストプロダクション", "配給・上映の機会"], general: ["生活と時間", "場所と費用", "関係と運営条件"],
  },
  "zh-Hans": {
    everyday: ["下班后的时间与会费", "课程或练习空间", "同伴与指导者"], dance: ["身体、伤病与恢复", "排练与练习空间", "演出合同与时间"], theatre: ["试镜与排练时间", "生计与演出场地", "同伴与关系"], music: ["练习与乐器", "传承、学习与学生", "演出与地区基础"], film: ["制作经费与团队", "后期制作", "发行与放映机会"], general: ["生活与时间", "空间与费用", "关系与运营条件"],
  },
  "zh-Hant": {
    everyday: ["下班後的時間與會費", "課程或練習空間", "同伴與指導者"], dance: ["身體、傷病與恢復", "排練與練習空間", "演出合約與時間"], theatre: ["試鏡與排練時間", "生計與演出場地", "同伴與關係"], music: ["練習與樂器", "傳承、學習與學生", "演出與地區基礎"], film: ["製作經費與團隊", "後期製作", "發行與放映機會"], general: ["生活與時間", "空間與費用", "關係與營運條件"],
  },
  fr: {
    everyday: ["temps après le travail et cotisation", "lieu de cours ou de pratique", "pairs et personnes qui enseignent"], dance: ["corps, blessure et récupération", "répétition et espace de pratique", "contrats de représentation et temps"], theatre: ["auditions et temps de répétition", "moyens de subsistance et salles", "pairs et relations"], music: ["pratique et instruments", "transmission, apprentissage et élèves", "représentation et ancrage local"], film: ["budget de production et équipe", "postproduction", "diffusion et possibilités de projection"], general: ["vie quotidienne et temps", "espace et coût", "relations et conditions d’organisation"],
  },
  es: {
    everyday: ["tiempo después del trabajo y cuota", "espacio de clase o ensayo", "pares y docentes"], dance: ["cuerpo, lesión y recuperación", "ensayo y espacio de práctica", "contratos de actuación y tiempo"], theatre: ["audiciones y tiempo de ensayo", "sustento y salas", "pares y relaciones"], music: ["práctica e instrumentos", "transmisión, aprendizaje y alumnado", "actuación y arraigo local"], film: ["presupuesto de producción y equipo", "posproducción", "distribución y oportunidades de exhibición"], general: ["vida cotidiana y tiempo", "espacio y coste", "relaciones y condiciones de funcionamiento"],
  },
  nl: {
    everyday: ["tijd na het werk en contributie", "ruimte voor les of oefenen", "peers en begeleiders"], dance: ["lichaam, blessure en herstel", "repetitie- en oefenruimte", "optreedcontracten en tijd"], theatre: ["audities en repetitietijd", "levensonderhoud en podia", "peers en relaties"], music: ["oefenen en instrumenten", "overdracht, leren en leerlingen", "optreden en lokale inbedding"], film: ["productiebudget en ploeg", "postproductie", "distributie en vertoningskansen"], general: ["dagelijks leven en tijd", "ruimte en kosten", "relaties en organisatorische voorwaarden"],
  },
  ms: {
    everyday: ["masa selepas kerja dan yuran", "ruang kelas atau latihan", "rakan dan pengajar"], dance: ["tubuh, kecederaan dan pemulihan", "latihan raptai dan ruang latihan", "kontrak persembahan dan masa"], theatre: ["uji bakat dan masa raptai", "sara hidup dan ruang persembahan", "rakan dan hubungan"], music: ["latihan dan alat muzik", "pewarisan, pembelajaran dan pelajar", "persembahan dan asas setempat"], film: ["bajet produksi dan kru", "pasca-produksi", "peluang edaran dan tayangan"], general: ["kehidupan harian dan masa", "ruang dan kos", "hubungan dan syarat operasi"],
  },
};

export function participantContextDHints(language = "ko", kind = "general") {
  const pack = dContextHintCopy[language] || dContextHintCopy.en;
  return pack[kind] || pack.general;
}

const contextualCopy = {
  ko: {
    AUDIENCE: { activityHeading: "요즘 문화예술을 만나는 방식을 살펴볼게요.", p14: "요즘 문화예술을 만나는 방식은 어느 쪽에 가까운가요?", p15: "실제 관람·참여 방식은 어떤 흐름에 가까운가요?", p12: "문화예술을 만나는 방식이 달라졌다고 느낀 한 장면을 들려주세요.", p13: "공연·전시·프로그램을 찾지 않는 때에도 이어지고 있던 관심이 있었나요?", p16: "요즘 문화예술을 만나는 방식에 영향을 주고 있는 현실은 무엇인가요?", p19: "문화예술을 다시 찾고 기억하게 한 기반이나 계기는 무엇이었나요?" },
    EVERYDAY: { activityHeading: "생활 안에서 이어지는 활동의 모습을 살펴볼게요.", p14: "요즘 이 활동은 어떤 모습으로 이어지고 있나요?", p15: "연습·모임·공연·발표처럼 이 활동이 다른 사람과 만나는 방식은 어떤 상태에 가까운가요?", p12: "그 변화가 연습·모임·공연·생활의 리듬에서 어떻게 느껴졌는지 한 장면 들려주세요.", p13: "밖으로 크게 드러나지 않는 때에도 연습·모임·배움·관계처럼 이어지고 있던 것이 있었나요?", p16: "이 활동의 리듬에 영향을 주고 있는 생활과 현실의 조건은 무엇인가요?", p19: "이 활동을 이어오게 한 사람·공간·배움·생활의 기반은 무엇이었나요?" },
    PROFESSIONAL: { activityHeading: "현재의 활동과 외부와 만나는 방식을 나누어 살펴볼게요.", p14: "현재 가장 중요한 문화예술 활동은 어떤 상태에 가까운가요?", p15: "현재 그 활동이 외부와 만나는 방식은 어떤 상태에 가까운가요?", p12: "그 전후로 달라진 것을 한 가지 들려주세요.", p13: "활동이 밖에서 잘 보이지 않던 때가 있었다면, 그동안에도 이어지고 있던 것이 있었나요?", p16: "현재의 활동 방식에 영향을 주고 있는 현실은 무엇인가요?", p19: "지금까지 활동을 이어오게 한 기반이나 계기는 무엇이었나요?" },
  },
  en: {
    AUDIENCE: { activityHeading: "Let us look at how you meet arts and culture these days.", p14: "Which description is closest to how you meet arts and culture these days?", p15: "Which flow is closest to your actual visits and participation?", p12: "Please share one moment when the way you meet arts and culture felt different.", p13: "When you were not seeking performances, exhibitions, or programmes, was there an interest that still continued?", p16: "What realities are shaping how you meet arts and culture these days?", p19: "What has helped you return to and remember arts and culture?" },
    EVERYDAY: { activityHeading: "Let us look at how this activity continues in everyday life.", p14: "Which description is closest to how this activity is continuing these days?", p15: "Which description is closest to how this activity meets other people through practice, gatherings, performance, or sharing?", p12: "Please share one moment showing how that change felt in practice, gatherings, performance, or everyday rhythm.", p13: "Even when it was not highly visible, was something such as practice, gathering, learning, or a relationship continuing?", p16: "What everyday and practical conditions are shaping this activity’s rhythm?", p19: "What people, spaces, learning, or everyday foundations have helped this activity continue?" },
    PROFESSIONAL: { activityHeading: "Let us look separately at your current activity and how it meets the outside world.", p14: "Which description is closest to the state of your most important arts and culture activity?", p15: "Which description is closest to how that activity currently meets the outside world?", p12: "Please share one thing that changed around that time.", p13: "Even if it was not visible from outside, was something continuing during that period?", p16: "What realities are shaping your current way of working?", p19: "What foundation or turning point has helped you continue this activity so far?" },
  },
  ja: {}, "zh-Hans": {}, "zh-Hant": {}, fr: {}, es: {}, nl: {}, ms: {},
};

const contextualLanguage = {
  ja: { AUDIENCE: ["最近の文化芸術との出会い方を見てみましょう。","最近の文化芸術との出会い方に最も近いものはどれですか？","実際の鑑賞・参加の流れに最も近いものはどれですか？","文化芸術との出会い方が変わったと感じた場面を一つ教えてください。","公演・展覧会・プログラムを探していない時にも続いていた関心はありましたか？","最近の文化芸術との出会い方に影響している現実的な条件は何ですか？","文化芸術を再び訪ね、記憶する支えやきっかけは何でしたか？"], EVERYDAY: ["生活の中で続く活動の様子を見てみましょう。","最近、この活動はどのような形で続いていますか？","稽古・集まり・公演・発表を通して、この活動が他者と出会う方法に最も近いものはどれですか？","その変化が稽古や集まり、公演、生活のリズムでどう感じられたか、一つの場面を教えてください。","大きく外に現れない時にも、稽古・集まり・学び・関係のように続いていたものはありましたか？","この活動のリズムに影響している生活上・現実上の条件は何ですか？","この活動を続ける助けとなった人、場所、学び、生活の基盤は何ですか？"], PROFESSIONAL: ["現在の活動と外部との出会い方を分けて見てみましょう。","現在、最も大切な文化芸術活動はどの状態に近いですか？","その活動が外部と出会う方法は、現在どの状態に近いですか？","その前後で変わったことを一つ教えてください。","外からは見えにくくても、その時期に続いていたことはありましたか？","現在の活動方法に影響している現実は何ですか？","これまで活動を続けてこられた基盤やきっかけは何でしたか？"] },
  "zh-Hans": { AUDIENCE: ["让我们看看你最近与文化艺术相遇的方式。","哪种描述最接近你最近接触文化艺术的方式？","哪种描述最接近你实际参观和参与的节奏？","请分享一个让你觉得接触文化艺术的方式发生变化的时刻。","即使没有寻找演出、展览或项目，是否仍有持续的兴趣？","哪些现实条件正在影响你最近接触文化艺术的方式？","什么基础或契机帮助你重新接触并记住文化艺术？"], EVERYDAY: ["让我们看看这项活动如何在日常生活中延续。","哪种描述最接近这项活动最近延续的样子？","哪种描述最接近这项活动通过练习、聚会、演出或分享与他人相遇的方式？","请分享一个场景，说明这种变化如何出现在练习、聚会、演出或生活节奏中。","即使不太显眼，是否仍有练习、聚会、学习或关系在延续？","哪些生活和现实条件正在影响这项活动的节奏？","哪些人、空间、学习或生活基础帮助这项活动延续？"], PROFESSIONAL: ["让我们分别看看目前的活动与它和外界相遇的方式。","哪种描述最接近你目前最重要的文化艺术活动状态？","哪种描述最接近这项活动目前与外界相遇的方式？","请分享一件在那前后发生变化的事。","即使外界不易看见，那段时间是否仍有某些事在延续？","哪些现实正在影响你目前的活动方式？","是什么基础或契机让你至今能够继续这项活动？"] },
  "zh-Hant": { AUDIENCE: ["讓我們看看你最近與文化藝術相遇的方式。","哪種描述最接近你最近接觸文化藝術的方式？","哪種描述最接近你實際參觀和參與的節奏？","請分享一個讓你覺得接觸文化藝術的方式發生變化的時刻。","即使沒有尋找演出、展覽或計畫，是否仍有持續的興趣？","哪些現實條件正在影響你最近接觸文化藝術的方式？","什麼基礎或契機幫助你重新接觸並記住文化藝術？"], EVERYDAY: ["讓我們看看這項活動如何在日常生活中延續。","哪種描述最接近這項活動最近延續的樣子？","哪種描述最接近這項活動透過練習、聚會、演出或分享與他人相遇的方式？","請分享一個場景，說明這種變化如何出現在練習、聚會、演出或生活節奏中。","即使不太顯眼，是否仍有練習、聚會、學習或關係在延續？","哪些生活和現實條件正在影響這項活動的節奏？","哪些人、空間、學習或生活基礎幫助這項活動延續？"], PROFESSIONAL: ["讓我們分別看看目前的活動與它和外界相遇的方式。","哪種描述最接近你目前最重要的文化藝術活動狀態？","哪種描述最接近這項活動目前與外界相遇的方式？","請分享一件在那前後發生變化的事。","即使外界不易看見，那段時間是否仍有某些事在延續？","哪些現實正在影響你目前的活動方式？","是什麼基礎或契機讓你至今能夠繼續這項活動？"] },
  fr: { AUDIENCE: ["Regardons comment vous rencontrez les arts et la culture aujourd’hui.","Quelle description se rapproche le plus de votre manière actuelle de rencontrer les arts et la culture ?","Quelle description se rapproche le plus de vos visites et participations effectives ?","Racontez un moment où votre manière de rencontrer les arts et la culture a changé.","Lorsque vous ne cherchiez pas de spectacle, d’exposition ou de programme, un intérêt restait-il présent ?","Quelles réalités influencent aujourd’hui votre manière de rencontrer les arts et la culture ?","Qu’est-ce qui vous a aidé à revenir vers les arts et la culture et à les garder en mémoire ?"], EVERYDAY: ["Regardons comment cette activité se poursuit dans la vie quotidienne.","Quelle description se rapproche le plus de la façon dont cette activité se poursuit aujourd’hui ?","Quelle description se rapproche le plus de la manière dont cette activité rencontre d’autres personnes par la pratique, les réunions, la performance ou le partage ?","Racontez une scène montrant comment ce changement s’est ressenti dans la pratique, les réunions, la performance ou le rythme quotidien.","Même lorsqu’elle était peu visible, quelque chose comme la pratique, le collectif, l’apprentissage ou une relation se poursuivait-il ?","Quelles conditions quotidiennes et concrètes influencent le rythme de cette activité ?","Quelles personnes, quels lieux, apprentissages ou appuis de la vie ont aidé cette activité à continuer ?"], PROFESSIONAL: ["Regardons séparément votre activité actuelle et la manière dont elle rencontre l’extérieur.","Quelle description se rapproche le plus de l’état de votre activité culturelle ou artistique la plus importante ?","Quelle description se rapproche le plus de la manière dont cette activité rencontre actuellement l’extérieur ?","Racontez une chose qui a changé à ce moment-là.","Même si cela n’était pas visible de l’extérieur, quelque chose se poursuivait-il pendant cette période ?","Quelles réalités influencent votre manière actuelle de travailler ?","Quelle base ou quel moment vous a aidé à poursuivre cette activité jusqu’ici ?"] },
  es: { AUDIENCE: ["Veamos cómo se encuentra con las artes y la cultura estos días.","¿Qué descripción se acerca más a su manera actual de encontrarse con las artes y la cultura?","¿Qué flujo se acerca más a sus visitas y participación reales?","Comparta un momento en que cambió su forma de encontrarse con las artes y la cultura.","Cuando no buscaba funciones, exposiciones o programas, ¿había algún interés que continuara?","¿Qué realidades influyen hoy en su forma de encontrarse con las artes y la cultura?","¿Qué le ha ayudado a volver a las artes y la cultura y a recordarlas?"], EVERYDAY: ["Veamos cómo esta actividad continúa en la vida cotidiana.","¿Qué descripción se acerca más a cómo continúa esta actividad estos días?","¿Qué descripción se acerca más a cómo esta actividad se encuentra con otras personas mediante práctica, reuniones, presentaciones o intercambio?","Comparta una escena que muestre cómo se sintió ese cambio en la práctica, las reuniones, la presentación o el ritmo cotidiano.","Aunque no fuera muy visible, ¿continuaba algo como la práctica, el grupo, el aprendizaje o una relación?","¿Qué condiciones cotidianas y prácticas influyen en el ritmo de esta actividad?","¿Qué personas, espacios, aprendizajes o apoyos cotidianos han ayudado a continuar esta actividad?"], PROFESSIONAL: ["Veamos por separado su actividad actual y la manera en que se encuentra con el exterior.","¿Qué descripción se acerca más al estado de su actividad cultural o artística más importante?","¿Qué descripción se acerca más a cómo esa actividad se relaciona actualmente con el exterior?","Comparta una cosa que cambió en ese momento.","Aunque no fuera visible desde fuera, ¿había algo que continuaba durante ese período?","¿Qué realidades influyen en su manera actual de trabajar?","¿Qué base o momento le ha ayudado a continuar esta actividad hasta ahora?"] },
  nl: { AUDIENCE: ["Laten we kijken hoe u tegenwoordig kunst en cultuur ontmoet.","Welke omschrijving past het best bij de manier waarop u nu kunst en cultuur ontmoet?","Welke omschrijving past het best bij uw daadwerkelijke bezoeken en deelname?","Vertel over één moment waarop de manier waarop u kunst en cultuur ontmoet veranderde.","Wanneer u niet naar voorstellingen, tentoonstellingen of programma’s zocht, was er dan een interesse die bleef doorgaan?","Welke omstandigheden beïnvloeden hoe u tegenwoordig kunst en cultuur ontmoet?","Wat heeft u geholpen om terug te keren naar kunst en cultuur en die te onthouden?"], EVERYDAY: ["Laten we kijken hoe deze activiteit in het dagelijks leven doorgaat.","Welke omschrijving past het best bij hoe deze activiteit nu doorgaat?","Welke omschrijving past het best bij hoe deze activiteit via oefenen, bijeenkomsten, optredens of delen andere mensen ontmoet?","Vertel één scène die laat zien hoe die verandering voelde in oefenen, bijeenkomsten, optreden of het dagelijkse ritme.","Ook wanneer het weinig zichtbaar was: bleef er iets doorgaan, zoals oefenen, samenkomen, leren of een relatie?","Welke dagelijkse en praktische voorwaarden beïnvloeden het ritme van deze activiteit?","Welke mensen, ruimtes, vormen van leren of dagelijkse steun hielpen deze activiteit voort te zetten?"], PROFESSIONAL: ["Laten we uw huidige activiteit en de manier waarop die de buitenwereld ontmoet apart bekijken.","Welke omschrijving past het best bij de toestand van uw belangrijkste kunst- of cultuuractiviteit?","Welke omschrijving past het best bij de manier waarop die activiteit nu de buitenwereld ontmoet?","Vertel één ding dat rond die tijd veranderde.","Ook als het van buitenaf niet zichtbaar was: bleef er in die periode iets doorgaan?","Welke realiteiten beïnvloeden uw huidige manier van werken?","Welke basis of welk moment heeft u geholpen deze activiteit tot nu toe voort te zetten?"] },
  ms: { AUDIENCE: ["Mari kita lihat cara anda bertemu seni dan budaya pada masa ini.","Huraian manakah yang paling hampir dengan cara anda bertemu seni dan budaya sekarang?","Aliran manakah yang paling hampir dengan lawatan dan penyertaan sebenar anda?","Kongsikan satu saat apabila cara anda bertemu seni dan budaya terasa berubah.","Apabila anda tidak mencari persembahan, pameran atau program, adakah minat yang masih berterusan?","Apakah keadaan yang mempengaruhi cara anda bertemu seni dan budaya sekarang?","Apakah yang membantu anda kembali kepada seni dan budaya serta mengingatinya?"], EVERYDAY: ["Mari kita lihat cara kegiatan ini diteruskan dalam kehidupan harian.","Huraian manakah yang paling hampir dengan cara kegiatan ini diteruskan sekarang?","Huraian manakah yang paling hampir dengan cara kegiatan ini bertemu orang lain melalui latihan, pertemuan, persembahan atau perkongsian?","Kongsikan satu adegan yang menunjukkan bagaimana perubahan itu dirasai dalam latihan, pertemuan, persembahan atau rentak harian.","Walaupun tidak begitu kelihatan, adakah sesuatu seperti latihan, pertemuan, pembelajaran atau hubungan masih berterusan?","Apakah keadaan kehidupan dan realiti yang mempengaruhi rentak kegiatan ini?","Apakah orang, ruang, pembelajaran atau asas kehidupan yang membantu kegiatan ini berterusan?"], PROFESSIONAL: ["Mari kita lihat kegiatan semasa anda dan cara ia bertemu dunia luar secara berasingan.","Keadaan manakah yang paling hampir dengan aktiviti seni dan budaya anda yang paling penting?","Keadaan manakah yang paling hampir dengan cara aktiviti itu bertemu dunia luar sekarang?","Kongsikan satu perkara yang berubah pada waktu itu.","Walaupun tidak kelihatan dari luar, adakah sesuatu masih berterusan dalam tempoh itu?","Apakah realiti yang mempengaruhi cara anda bekerja sekarang?","Apakah asas atau detik yang membantu anda meneruskan aktiviti ini hingga kini?"] },
};

for (const [language, groups] of Object.entries(contextualLanguage)) {
  contextualCopy[language] = Object.fromEntries(Object.entries(groups).map(([kind, values]) => [kind, Object.fromEntries(["activityHeading", "p14", "p15", "p12", "p13", "p16", "p19"].map((key, index) => [key, values[index]]))]));
}
export function participantContextualCopy(language = "ko", kind = "PROFESSIONAL") {
  return contextualCopy[language]?.[kind] || contextualCopy.en[kind] || contextualCopy.ko.PROFESSIONAL;
}
