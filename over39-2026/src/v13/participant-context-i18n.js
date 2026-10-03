import { withHongKong } from "./hong-kong.js?v=v7-20261003-r109";
// Direct participant-facing copy for the additive cultural-arts context.
// IDs remain stable in participant-context.js; this table never changes R01–R20.
const base = {
  ko: {
    more: "더 자세히 남기기 — 방식 · 형태 · 누구의 경험인지",
    title: "이번 답변이 닿는 문화예술 활동의 맥락을 알려주세요.",
    help: "분야와 활동 형태를 함께 남깁니다. 이 선택은 전문성의 등급이나 자격을 뜻하지 않습니다.",
    field: "어떤 문화예술 분야와 가장 가까운가요?", mode: "그 분야와 현재 어떤 방식으로 관계하고 있나요?", form: "현재 이 활동은 생활 안에서 어떤 형태로 이어지고 있나요?", unit: "이번 답변은 누구의 경험을 중심으로 하나요?",
    fieldOther: "가까운 분야를 직접 적어주세요.", modeOther: "현재의 관계 방식을 직접 적어주세요.", unitOther: "이번 답변의 중심을 직접 적어주세요.",
  },
  en: {
    more: "Add more detail — how, in what form, whose experience",
    title: "Tell us where in arts and culture this response comes from.",
    help: "Here you note your field and the form your activity takes. Your choice does not indicate any level of expertise or qualification.",
    field: "Which fields of arts and culture are closest to you?", mode: "How are you currently involved in that field?", form: "What form does this activity take in your life now?", unit: "Whose experience is this answer mainly about?",
    fieldOther: "Please name the field in your own words.", modeOther: "Please describe how you are involved, in your own words.", unitOther: "Please tell us whose experience this response centres on.",
  },
  ja: {
    more: "もう少し詳しく — 関わり方・形・誰の経験か",
    title: "今回の回答につながる文化芸術活動の背景を教えてください。", help: "分野と活動の形をあわせて記録します。この選択は、専門性の高さや資格を意味するものではありません。",
    field: "いちばん近い文化芸術の分野はどれですか？", mode: "いま、その分野とはどのように関わっていますか？", form: "この活動は、いまの暮らしの中でどのような形で続いていますか？", unit: "今回の回答は、どなたの経験が中心ですか？",
    fieldOther: "近い分野を自由に書いてください。", modeOther: "今の関わり方を、ご自身の言葉で書いてください。", unitOther: "今回の回答の中心になる方を、ご自身の言葉で書いてください。",
  },
  "zh-Hans": {
    more: "多补充一些 — 方式、形式、是谁的经历",
    title: "请告诉我们这份回答所涉及的文化艺术活动背景。", help: "请在这里一并留下领域和活动形式。这些选择不代表专业等级或资格。",
    field: "哪些文化艺术领域与您最贴近？", mode: "您目前和这个领域是怎样的关系？", form: "目前，这项活动在您的生活里以什么形式延续着？", unit: "这次的回答，主要围绕谁的经历？",
    fieldOther: "请用自己的话写下相关领域。", modeOther: "请用自己的话写下您现在和这个领域的关系。", unitOther: "请用自己的话写下这次回答的重心。",
  },
  "zh-Hant": {
    more: "補充細節 — 方式、形式、以誰的經驗為主",
    title: "請告訴我們這份回答所涉及的文化藝術活動背景。", help: "這裡一併記下領域與活動形式。這些選擇不代表專業等級，也不代表資格。",
    field: "哪些文化藝術領域和您最接近？", mode: "您現在以什麼方式參與這個領域？", form: "這項活動目前以什麼形式在您的生活中延續？", unit: "這次的回答以誰的經驗為主？",
    fieldOther: "請用自己的話寫下相關領域。", modeOther: "請用自己的話寫下您現在和這個領域的關係。", unitOther: "請用自己的話寫下這次回答的重心。",
  },
  fr: {
    more: "Ajouter des précisions — manière, forme, à qui appartient l’expérience",
    title: "Dites-nous à quel endroit des arts et de la culture cette réponse se rattache.", help: "Vous précisez ici le domaine et la forme de votre activité. Ce choix n’indique ni un niveau d’expertise ni une qualification.",
    field: "Quels domaines artistiques et culturels vous sont les plus proches ?", mode: "Quel est aujourd’hui votre lien avec ce domaine ?", form: "Sous quelle forme cette activité se poursuit-elle aujourd’hui dans votre vie ?", unit: "Dans cette réponse, de quelle expérience parlez-vous surtout ?",
    fieldOther: "Indiquez le domaine avec vos propres mots.", modeOther: "Décrivez vous-même votre manière d’être en lien avec ce domaine.", unitOther: "Dites-nous ce qui est au centre de cette réponse.",
  },
  es: {
    more: "Añadir más detalles — modo, forma y de quién es la experiencia",
    title: "Cuéntenos en qué actividad cultural o artística se apoya esta respuesta.", help: "Aquí anotamos a la vez el ámbito y la forma de su actividad. Lo que elija no indica un nivel de profesionalidad ni ninguna acreditación.",
    field: "¿Qué ámbitos de las artes y la cultura le resultan más cercanos?", mode: "¿Cómo se relaciona actualmente con ese ámbito?", form: "¿De qué manera sigue hoy esta actividad en su vida?", unit: "¿De quién es, sobre todo, la experiencia que recoge esta respuesta?",
    fieldOther: "Escriba con sus propias palabras el ámbito más cercano.", modeOther: "Escriba con sus propias palabras de qué forma se relaciona ahora.", unitOther: "Escriba con sus propias palabras en qué se centra esta respuesta.",
  },
  nl: {
    more: "Meer vertellen — hoe, in welke vorm, wiens ervaring",
    title: "Vertel ons bij welk deel van kunst en cultuur dit antwoord hoort.", help: "Hier geeft u aan in welk vakgebied u actief bent en in welke vorm. Die keuze zegt niets over hoe deskundig u bent of welke kwalificaties u hebt.",
    field: "Welke kunst- en cultuurgebieden staan het dichtst bij u?", mode: "Hoe bent u momenteel bij dat gebied betrokken?", form: "In welke vorm gaat deze activiteit nu door in uw leven?", unit: "Wiens ervaring staat centraal in dit antwoord?",
    fieldOther: "Noem het gebied in uw eigen woorden.", modeOther: "Beschrijf hoe u zich nu tot dat gebied verhoudt.", unitOther: "Beschrijf wat centraal staat in dit antwoord.",
  },
  ms: {
    more: "Tambah butiran — cara, bentuk, pengalaman siapa",
    title: "Ceritakan kegiatan seni dan budaya yang menjadi latar jawapan ini.", help: "Kami mencatat bidang dan bentuk kegiatan anda di sini. Pilihan ini tidak menandakan tahap kepakaran atau kelayakan anda.",
    field: "Bidang seni dan budaya manakah yang paling dekat dengan anda?", mode: "Bagaimanakah anda terlibat dengan bidang itu sekarang?", form: "Dalam bentuk apakah kegiatan ini berterusan dalam kehidupan anda sekarang?", unit: "Pengalaman siapakah yang menjadi tumpuan jawapan ini?",
    fieldOther: "Tulis sendiri bidang yang paling dekat dengan anda.", modeOther: "Terangkan cara anda terlibat.", unitOther: "Tulis sendiri apa yang menjadi tumpuan jawapan ini.",
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
    ["Visual arts","Photography, moving image, and media","Craft and design","Film","Theatre and performance","Dance","Music","Traditional arts and culture","Literature and publishing","Cultural heritage and archives","Interdisciplinary practice","Local and everyday culture","Other — write your own"],
    ["Creating and making","Directing, choreography, composition, or structuring","Performing, playing, or live presentation","Planning and producing","Teaching, passing on tradition, or classes","Criticism and research","Documentation and archives","Editing, publishing, and media","Technical and production support","Running a space or institution","Distribution and patronage","Learning or training","Hobby, club, or everyday arts","Local or community activity","Other — write your own"],
    ["I do it as my main work","I keep it going alongside other work","I am paid when there is a project","I keep it going alongside teaching or classes","I do it unpaid, as volunteering or community activity","I keep it going as a hobby or in a club","I am learning or training","I am taking a break or adjusting my pace","I have moved into a different role","It is hard to pin down to one thing"],
    ["My own activity","A team or group I belong to","Both my own and my team’s activity","Another form — write your own"],
  ],
  ja: [
    ["視覚芸術","写真・映像・メディア","工芸・デザイン","映画","演劇・パフォーマンス","ダンス","音楽","伝統芸術・伝統文化","文学・出版","文化遺産・記録","分野横断・複合","地域・生活文化","その他（自由記入）"],
    ["創作・制作","演出・振付・作曲・構成","上演・演奏・実演","企画・プロデュース","教育・継承・指導","批評・研究","記録・アーカイブ","編集・出版・メディア","技術・制作支援","空間・機関の運営","流通・支援","学び・稽古中","趣味・サークル・暮らしの中の芸術","地域・コミュニティ活動","その他（自由記入）"],
    ["主な仕事として続けている","ほかの仕事と並行して続けている","プロジェクトがある時に有償で行う","教育・指導と並行して続けている","無償・ボランティア・コミュニティ活動として行う","趣味・サークル活動として続けている","学んでいる・稽古している","今は休んでいる、またはペースを調整している","以前とは違う役割に移った","ひとつには絞りにくい"],
    ["個人としての活動","所属するチーム・グループの活動","個人とチームの両方","別の形（自由記入）"],
  ],
  "zh-Hans": [
    ["视觉艺术","摄影、影像与媒体","工艺与设计","电影","戏剧与表演","舞蹈","音乐","传统艺术与传统文化","文学与出版","文化遗产与档案","跨界与融合","地方与日常文化","其他（请说明）"],
    ["创作与制作","导演、编舞、作曲、编排","表演、演奏、现场演出","策划与统筹","教育、传承、授课","评论与研究","记录与档案","编辑、出版与媒体","技术与制作支持","空间与机构运营","流通与赞助","学习或训练中","兴趣、社团、生活艺术","地方与社区活动","其他（请说明）"],
    ["以此为主业","与其他工作并行","有项目时有偿进行","与教学、授课结合进行","作为无偿、志愿或社区活动进行","作为兴趣或社团活动继续","正在学习或训练","目前休息或调整节奏","角色和以前不同了","很难归为一种"],
    ["我个人的活动","我所在团队或团体的活动","个人与团队活动兼有","其他形式 — 请自行填写"],
  ],
  "zh-Hant": [
    ["視覺藝術","攝影、影像與媒體","工藝與設計","電影","戲劇與表演","舞蹈","音樂","傳統藝術與傳統文化","文學與出版","文化遺產與檔案","跨領域與綜合實踐","地方與日常文化","其他（請說明）"],
    ["創作與製作","導演、編舞、作曲或構成","表演、演奏或現場呈現","策劃與製作統籌","教育、傳承或教學","評論與研究","記錄與檔案","編輯、出版與媒體","技術與製作支援","空間或機構營運","流通與贊助","學習或訓練中","興趣、社團或生活藝術","地方或社群活動","其他（請說明）"],
    ["以此為主要工作","一邊做其他工作，一邊持續","有專案時獲得報酬","與教學或授課一起持續","作為無償、志願或社群活動","作為興趣或社團活動持續","正在學習或訓練","目前休息或調整節奏","轉向不同角色","難以用一種方式概括"],
    ["我個人的活動","我所屬團隊或小組的活動","個人與團隊都有","其他形式（請說明）"],
  ],
  fr: [
    ["Arts visuels","Photographie, vidéo et médias","Métiers d’art et design","Cinéma","Théâtre et spectacle vivant","Danse","Musique","Arts et cultures traditionnels","Littérature et édition","Patrimoine culturel et archives","Pratiques interdisciplinaires","Culture de proximité","Autre — précisez"],
    ["Création et réalisation","Mise en scène, chorégraphie, composition ou conception","Interprétation, jeu, performance","Conception et production","Enseignement, transmission ou cours","Critique et recherche","Documentation et archives","Édition, publication et médias","Soutien technique et de production","Gestion d’un lieu ou d’une institution","Diffusion et mécénat","En apprentissage ou en formation","Loisir, club, pratique amateur","Activité locale ou communautaire","Autre — précisez"],
    ["C’est mon activité principale","Je la mène en parallèle d’un autre travail","J’en tire un revenu quand il y a un projet","Je la poursuis en enseignant ou en donnant des cours","Je la pratique bénévolement ou dans un collectif","Je la poursuis comme loisir ou en club","Je suis en apprentissage ou en formation","Je fais une pause ou j’adapte mon rythme","J’ai changé de rôle","Difficile de choisir une seule réponse"],
    ["Mon activité personnelle","L’activité de mon équipe ou de mon groupe","Les deux : la mienne et celle de mon équipe","Une autre forme — précisez"],
  ],
  es: [
    ["Artes visuales","Fotografía, imagen en movimiento y medios","Artesanía y diseño","Cine","Teatro y performance","Danza","Música","Artes y culturas tradicionales","Literatura y edición","Patrimonio cultural y archivo","Prácticas interdisciplinarias","Cultura local y cotidiana","Otro — escríbalo usted"],
    ["Creación y producción","Dirección, coreografía, composición o dramaturgia","Actuación, interpretación musical o escénica en vivo","Comisariado y producción","Educación, transmisión o clases","Crítica e investigación","Documentación y archivo","Edición, publicación y medios","Apoyo técnico y de producción","Gestión de un espacio o institución","Distribución y patrocinio","En aprendizaje o formación","Afición, asociación o arte amateur","Actividad local o comunitaria","Otro — escríbalo usted"],
    ["Es mi trabajo principal","La compagino con otro trabajo","Cobro por ella cuando hay proyectos","La combino con la enseñanza o con clases","La hago sin cobrar, como voluntariado o actividad comunitaria","La mantengo como afición o en un grupo de aficionados","Estoy aprendiendo o formándome","Estoy en pausa o ajustando el ritmo","He pasado a otro papel","Es difícil resumirlo en una sola opción"],
    ["Mi actividad individual","La actividad de un equipo o grupo al que pertenezco","Mi actividad individual y la de un equipo","Otra forma — escríbala usted"],
  ],
  nl: [
    ["Beeldende kunst","Fotografie, bewegend beeld en media","Ambacht en ontwerp","Film","Theater en performance","Dans","Muziek","Traditionele kunst en cultuur","Literatuur en uitgeverij","Cultureel erfgoed en archief","Interdisciplinaire praktijk","Lokale en alledaagse cultuur","Anders — zelf invullen"],
    ["Maken en produceren","Regie, choreografie, compositie of vormgeving","Optreden, spelen of uitvoeren","Cureren en produceren","Onderwijs, overdracht of lesgeven","Kritiek en onderzoek","Documentatie en archief","Redactie, publicatie en media","Techniek en productieondersteuning","Een ruimte of instelling leiden","Distributie en ondersteuning","Leren of oefenen","Hobby, club of amateurkunst","Activiteit in de regio of gemeenschap","Anders — zelf invullen"],
    ["Ik doe het als mijn hoofdwerk","Ik doe het naast ander werk","Ik word betaald wanneer er een project is","Ik combineer het met lesgeven","Ik doe het onbetaald, vrijwillig of in de gemeenschap","Ik doe het als hobby of in een vereniging","Ik ben aan het leren of oefenen","Ik neem rust of doe het kalmer aan","Ik heb nu een andere rol dan vroeger","Dat is moeilijk in één omschrijving te vatten"],
    ["Mijn eigen activiteit","De activiteit van een team of groep waar ik bij hoor","Mijn eigen activiteit en die van het team samen","Een andere vorm — zelf invullen"],
  ],
  ms: [
    ["Seni visual","Fotografi, video dan media","Kraf dan reka bentuk","Filem","Teater dan persembahan","Tarian","Muzik","Seni dan budaya tradisional","Sastera dan penerbitan","Warisan budaya dan arkib","Amalan antara disiplin","Budaya setempat dan kehidupan harian","Lain-lain — nyatakan sendiri"],
    ["Penciptaan dan penghasilan","Pengarahan, koreografi, gubahan atau susunan","Persembahan, permainan muzik atau penyampaian langsung","Perancangan dan produksi","Pendidikan, pewarisan atau kelas","Kritikan dan penyelidikan","Dokumentasi dan arkib","Penyuntingan, penerbitan dan media","Sokongan teknikal dan produksi","Pengurusan ruang dan institusi","Pengedaran dan penajaan","Belajar atau berlatih","Hobi, kelab atau seni harian","Kegiatan setempat atau komuniti","Lain-lain — nyatakan sendiri"],
    ["Saya meneruskannya sebagai kerja utama","Saya meneruskannya bersama kerja lain","Saya melakukannya dengan bayaran apabila ada projek","Saya meneruskannya sambil mengajar","Saya melakukannya tanpa bayaran, sebagai sukarelawan atau dalam komuniti","Saya meneruskannya sebagai hobi atau kegiatan kelab","Saya sedang belajar atau berlatih","Saya sedang berehat atau menyesuaikan rentak","Saya beralih ke peranan lain","Sukar disimpulkan dalam satu jawapan"],
    ["Kegiatan saya sebagai individu","Kegiatan pasukan atau kumpulan yang saya sertai","Kegiatan individu dan pasukan sekali gus","Bentuk lain — nyatakan sendiri"],
  ],
};

export function participantContextCopy(language = "ko") { return base[language] || base.en; }
export function participantContextLabels(language = "ko") { return labels[language] || labels.en; }

// P05 keeps its original duration codes. Only the participant-facing entry
// sentence changes so no one has to describe a long-term cultural practice as
// a job title in order to answer it.
const activityScreenCopy = {
  ko: {
    purposeAudience: "지금을 묻는 이유가 있어요. 그 기억 이후로 문화예술과의 관계가 어떻게 이어지고 달라졌는지를 남기려 합니다.", purposeOther: "지금을 묻는 이유가 있어요. 그 기억 이후로 활동이 어떻게 이어지고 달라졌는지를 남기려 합니다.",
    headingAudience: "문화예술을 찾아보고 참여해 온 방식을 알려주세요.", headingOther: "현재의 활동과 상태를 알려주세요.",
    p05Audience: "문화예술을 스스로 찾아보거나 전시·프로그램에 참여하기 시작한 지 얼마나 되었나요?", p05Other: "처음에 고르신 분야의 활동을 시작한 지 얼마나 되었나요?", yearLabel: "기억한다면 시작 연도를 적어주세요.", yearPlaceholder: "예: 2008",
  },
  en: {
    purposeAudience: "We ask about the present for a reason. We want to record how your relationship with arts and culture has carried on and changed since that memory.", purposeOther: "We ask about the present for a reason. We want to record how your activity has carried on and changed since that memory.",
    headingAudience: "Tell us how you have sought out and taken part in arts and culture.", headingOther: "Tell us about your current activity and situation.",
    p05Audience: "How long is it since you started seeking out arts and culture yourself, or taking part in exhibitions and programmes?", p05Other: "How long have you been active in the field you chose at the start?", yearLabel: "If you remember, enter the year you began.", yearPlaceholder: "For example, 2008",
  },
  ja: {
    purposeAudience: "いまのことをお聞きするのには理由があります。その記憶のあと、文化芸術との関わりがどう続き、どう変わってきたのかを記録しておきたいのです。", purposeOther: "いまのことをお聞きするのには理由があります。その記憶のあと、活動がどう続き、どう変わってきたのかを記録しておきたいのです。",
    headingAudience: "文化芸術をどのように探し、参加してきたかを教えてください。", headingOther: "いまの活動と、その状況を教えてください。",
    p05Audience: "文化芸術を自分で探したり、展覧会やプログラムに参加したりし始めてから、どのくらいになりますか？", p05Other: "最初に選んだ分野の活動を始めて、どのくらいになりますか？", yearLabel: "覚えていれば、始めた年を入力してください。", yearPlaceholder: "例：2008",
  },
  "zh-Hans": {
    purposeAudience: "问起现在，是有原因的。我们想记下：那段记忆之后，您和文化艺术的关系是怎样延续、又是怎样变化的。", purposeOther: "问起现在，是有原因的。我们想记下：那段记忆之后，您的活动是怎样延续、又是怎样变化的。",
    headingAudience: "请说说您一直以来是怎样寻找、参与文化艺术的。", headingOther: "请说说您现在的活动和状态。",
    p05Audience: "您开始主动接触文化艺术、参加展览或活动，有多久了？", p05Other: "您在一开始选的领域里活动，有多久了？", yearLabel: "如果记得，请填写开始的年份。", yearPlaceholder: "例如：2008",
  },
  "zh-Hant": {
    purposeAudience: "問到現在，是有原因的。我們想記下在那段記憶之後，您與文化藝術的關係如何延續、又有哪些改變。", purposeOther: "問到現在，是有原因的。我們想記下在那段記憶之後，您的活動如何延續、又有哪些改變。",
    headingAudience: "請談談您一直以來如何尋找、參與文化藝術。", headingOther: "請告訴我們您目前的活動與狀態。",
    p05Audience: "您開始主動接觸文化藝術，或參加展覽、活動，至今多久了？", p05Other: "從您開始在最初選擇的領域活動到現在，有多久了？", yearLabel: "如果記得，請填寫開始的年份。", yearPlaceholder: "例如：2008",
  },
  fr: {
    purposeAudience: "Si nous vous interrogeons sur le présent, c’est pour une raison : nous voulons garder une trace de ce qui, depuis ce souvenir, s’est poursuivi et a changé dans votre lien aux arts et à la culture.", purposeOther: "Si nous vous interrogeons sur le présent, c’est pour une raison : nous voulons garder une trace de ce qui, depuis ce souvenir, s’est poursuivi et a changé dans votre activité.",
    headingAudience: "Parlez-nous de la façon dont vous allez vers les arts et la culture et y prenez part.", headingOther: "Parlez-nous de votre activité et de sa situation aujourd’hui.",
    p05Audience: "Depuis combien de temps allez-vous de vous-même vers les arts et la culture, ou participez-vous à des expositions et à des programmes ?", p05Other: "Combien de temps s’est-il écoulé depuis vos débuts dans le domaine choisi au départ ?", yearLabel: "Si vous vous en souvenez, indiquez l’année de début.", yearPlaceholder: "Par exemple : 2008",
  },
  es: {
    purposeAudience: "Preguntamos por el presente por una razón: queremos dejar constancia de cómo ha seguido y cómo ha cambiado su relación con el arte y la cultura desde aquel recuerdo.", purposeOther: "Preguntamos por el presente por una razón: queremos dejar constancia de cómo ha seguido y cómo ha cambiado su actividad desde aquel recuerdo.",
    headingAudience: "Cuéntenos cómo se ha acercado al arte y la cultura y cómo ha participado en ellos.", headingOther: "Háblenos de su actividad y de su situación actual.",
    p05Audience: "¿Cuánto hace que empezó a buscar por su cuenta el arte y la cultura, o a participar en exposiciones y programas?", p05Other: "¿Cuánto hace que empezó su actividad en el ámbito que eligió al principio?", yearLabel: "Si lo recuerda, indique el año en que comenzó.", yearPlaceholder: "Por ejemplo: 2008",
  },
  nl: {
    purposeAudience: "Er is een reden dat we naar het heden vragen. We willen vastleggen hoe uw band met kunst en cultuur sinds die herinnering is doorgegaan en veranderd.", purposeOther: "Er is een reden dat we naar het heden vragen. We willen vastleggen hoe uw activiteit sinds die herinnering is doorgegaan en veranderd.",
    headingAudience: "Vertel ons hoe u kunst en cultuur hebt opgezocht en eraan hebt meegedaan.", headingOther: "Vertel ons wat u nu doet en hoe het ervoor staat.",
    p05Audience: "Hoe lang geleden bent u begonnen zelf kunst en cultuur op te zoeken of naar tentoonstellingen en programma’s te gaan?", p05Other: "Hoe lang geleden bent u begonnen in het gebied dat u eerst koos?", yearLabel: "Vul het beginjaar in als u het zich herinnert.", yearPlaceholder: "Bijvoorbeeld: 2008",
  },
  ms: {
    purposeAudience: "Ada sebabnya kami bertanya tentang masa kini. Kami mahu merakam bagaimana hubungan anda dengan seni dan budaya berterusan dan berubah sejak ingatan itu.", purposeOther: "Ada sebabnya kami bertanya tentang masa kini. Kami mahu merakam bagaimana kegiatan itu berterusan dan berubah sejak ingatan itu.",
    headingAudience: "Ceritakan bagaimana anda selama ini mencari dan menyertai seni dan budaya.", headingOther: "Ceritakan tentang kegiatan dan keadaan anda sekarang.",
    p05Audience: "Sudah berapa lama sejak anda mula mencari seni dan budaya atas kehendak sendiri atau menyertai pameran dan program?", p05Other: "Sudah berapa lama sejak anda mula bergiat dalam bidang yang anda pilih pada awal tadi?", yearLabel: "Jika anda ingat, masukkan tahun anda bermula.", yearPlaceholder: "Contohnya: 2008",
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
    AUDIENCE: { activityHeading: "요즘 문화예술은 어떻게 만나고 계신지요?", p14: "요즘 문화예술을 만나는 방식은 어느 쪽에 가까운가요?", p15: "실제 관람·참여 방식은 어떤 흐름에 가까운가요?", p12: "문화예술을 만나는 방식이 달라졌다고 느낀 한 장면을 들려주세요.", p13: "공연·전시·프로그램을 자주 찾지 않던 때가 있었다면, 그때도 이어지던 관심이 있었나요? 다른 길로 이어졌어도 괜찮아요.", p16: "요즘 문화예술을 만나는 방식에 영향을 주고 있는 현실은 무엇인가요?", p19: "문화예술을 찾고 기억하게 한 기반이나 계기는 무엇이었나요?" },
    EVERYDAY: { activityHeading: "생활 안에서 이 활동은 요즘 어떻게 이어지고 있는지요?", p14: "요즘 이 활동은 어떤 모습으로 이어지고 있나요?", p15: "연습·모임·공연·발표처럼 이 활동이 다른 사람과 만나는 방식은 어떤 상태에 가까운가요?", p12: "그 변화가 연습·모임·공연·생활의 리듬에서 어떻게 느껴졌는지 한 장면 들려주세요.", p13: "밖으로 크게 드러나지 않던 때가 있었다면, 그때도 계속하던 것이 있었나요? 아주 작은 것이어도 괜찮아요.", p16: "이 활동의 리듬에 영향을 주고 있는 생활과 현실의 조건은 무엇인가요?", p19: "이 활동을 이어오게 한 사람·공간·배움·생활의 기반은 무엇이었나요?" },
    PROFESSIONAL: { activityHeading: "지금의 활동은 어떤 모습이고, 밖과는 어떻게 만나고 있는지요?", p14: "현재 가장 중요한 문화예술 활동은 어떤 상태에 가까운가요?", p15: "현재 그 활동이 외부와 만나는 방식은 어떤 상태에 가까운가요?", p12: "그 전후로 달라진 것을 한 가지 들려주세요.", p13: "활동이 밖에서 잘 보이지 않던 때가 있었다면, 그때도 계속하던 일이 있었나요? 남들은 몰랐던 일이어도 괜찮아요.", p16: "현재의 활동 방식에 영향을 주고 있는 현실은 무엇인가요?", p19: "지금까지 활동을 이어오게 한 기반이나 계기는 무엇이었나요?" },
  },
  en: {
    AUDIENCE: { activityHeading: "How do you encounter arts and culture these days?", p14: "Which comes closest to how you encounter arts and culture these days?", p15: "Which comes closest to how you actually attend and take part?", p12: "Please share one moment when the way you encounter arts and culture felt different.", p13: "If there was a time when you rarely went to performances, exhibitions or programmes, did an interest carry on even then? It’s fine if it carried on in another way.", p16: "What realities are shaping how you encounter arts and culture these days?", p19: "What foundation or turning point has led you to seek out and remember arts and culture?" },
    EVERYDAY: { activityHeading: "How is this activity carrying on in your everyday life these days?", p14: "Which description is closest to how this activity is continuing these days?", p15: "Which description is closest to how this activity meets other people through practice, gatherings, performance, or sharing?", p12: "Please share one moment showing how that change felt in the rhythm of practice, gatherings, performance, or everyday life.", p13: "If there was a time when it was not very visible to others, was there anything you kept doing then? Even something very small counts.", p16: "What everyday and practical conditions are shaping this activity’s rhythm?", p19: "What people, spaces, learning, or everyday foundations have helped this activity continue?" },
    PROFESSIONAL: { activityHeading: "What does your activity look like now, and how does it meet the outside world?", p14: "Where does your most important arts and culture activity stand right now?", p15: "How does that activity meet the outside world at the moment?", p12: "Please share one thing that changed around that time.", p13: "If there was a time when your work was hard to see from the outside, was there something you kept doing even then? It’s fine if no one else knew about it.", p16: "What realities are shaping the way you work now?", p19: "What foundation or turning point has kept your activity going until now?" },
  },
  ja: {}, "zh-Hans": {}, "zh-Hant": {}, fr: {}, es: {}, nl: {}, ms: {},
};

const contextualLanguage = {
  ja: { AUDIENCE: ["最近、文化芸術とはどのように出会っていますか。","最近の文化芸術との出会い方は、どれに近いですか？","実際の鑑賞や参加は、どの流れに近いですか？","文化芸術との出会い方が変わったと感じた場面を一つ教えてください。","公演・展覧会・プログラムにあまり足を運ばなかった時期があったなら、そのあいだも続いていた関心はありましたか？　別のかたちで続いていたものでもかまいません。","最近の文化芸術との出会い方に影響している現実的な条件は何ですか？","文化芸術を訪ね、記憶にとどめるようになった支えやきっかけは何でしたか？"], EVERYDAY: ["暮らしの中で、この活動は最近どのように続いていますか。","最近、この活動はどのような形で続いていますか？","稽古・集まり・公演・発表など、この活動が他の人とつながる形は、どの状態に近いですか？","その変化が稽古や集まり、公演、生活のリズムでどう感じられたか、一つの場面を教えてください。","外に大きく現れなかった時期があったなら、その間も続けていたことはありましたか？ごく小さなことでもかまいません。","この活動のリズムに影響している生活上・現実上の条件は何ですか？","この活動を続ける助けとなった人、場所、学び、生活の基盤は何ですか？"], PROFESSIONAL: ["いまの活動はどんな様子で、外とはどのようにつながっていますか。","今、いちばん大切にしている文化芸術の活動は、どの状態に近いですか？","その活動が外とつながる形は、今どの状態に近いですか？","その前後で変わったことを一つ教えてください。","活動が外からあまり見えなかった時期があったなら、そのあいだも続けていたことはありましたか？　周りが知らなかったことでもかまいません。","いまの活動のしかたに影響している現実は何ですか？","これまで活動を続けてこられた支えやきっかけは、何でしたか？"] },
  "zh-Hans": { AUDIENCE: ["最近，您是怎样接触文化艺术的？","您最近接触文化艺术的方式，更接近哪一种？","您实际去观看、参与的方式，更接近哪种节奏？","请分享一个让您觉得接触文化艺术的方式发生变化的时刻。","如果曾有一段时间不常去看演出、展览或参加活动，那时还有延续着的兴趣吗？通过别的途径延续也没关系。","哪些现实情况正在影响您最近接触文化艺术的方式？","是什么样的基础或契机，让您去寻找、记住文化艺术？"], EVERYDAY: ["在生活中，这项活动最近是如何延续的呢？","哪种描述最接近这项活动最近延续的样子？","哪种描述最接近这项活动通过练习、聚会、演出或分享与他人相遇的方式？","请分享一个场景，说明这种变化如何出现在练习、聚会、演出或生活节奏中。","如果曾有一段时间，这件事不太为外人所见，那段时间您仍有持续在做的事吗？再小的事也没关系。","哪些生活和现实条件正在影响这项活动的节奏？","哪些人、空间、学习或生活基础帮助这项活动延续？"], PROFESSIONAL: ["您现在的活动是什么样子？又是怎样与外界接触的？","您目前最重要的文化艺术活动，更接近哪种状态？","这项活动目前与外界接触的方式，更接近哪种状态？","请分享一件在那前后发生变化的事。","如果曾有一段时间，您的活动在外面不太被看见，那时还有一直在做的事吗？别人不知道的也没关系。","哪些现实情况正在影响您现在的活动方式？","是什么样的基础或契机，让您的活动一直延续到今天？"] },
  "zh-Hant": { AUDIENCE: ["最近您都怎麼接觸文化藝術呢？","您最近接觸文化藝術的方式，比較接近哪一種？","您實際觀賞、參與的情形，比較接近哪一種？","請分享一個讓您覺得接觸文化藝術的方式發生變化的時刻。","如果曾有一段時間，您不常去看演出、展覽或參加活動，那時是否仍有延續著的興趣？就算是透過其他途徑延續，也沒關係。","有哪些現實條件，正影響著您最近接觸文化藝術的方式？","是什麼樣的基礎或契機，讓您去尋找、記住文化藝術？"], EVERYDAY: ["在生活中，這項活動最近是如何延續的呢？","哪種描述最接近這項活動最近延續的樣子？","哪種描述最接近這項活動透過練習、聚會、演出或分享與他人接觸的方式？","請分享一個場景，說明這種變化如何出現在練習、聚會、演出或生活節奏中。","如果曾有一段時間，這件事不太為外人所見，那段時間您仍有持續在做的事嗎？再小的事也沒關係。","哪些生活和現實條件正在影響這項活動的節奏？","哪些人、空間、學習或生活基礎幫助這項活動延續？"], PROFESSIONAL: ["您現在的活動是什麼樣貌？又是如何和外界接觸的呢？","您目前最重要的文化藝術活動，比較接近哪一種狀態？","這項活動目前和外界接觸的方式，比較接近哪一種？","請分享一件在那前後發生變化的事。","如果曾有一段時間，您的活動在外人看來不太明顯，那時是否仍有一直在做的事？就算是別人不知道的事也沒關係。","有哪些現實條件，正影響著您目前的活動方式？","是什麼樣的基礎或契機，讓您的活動一路持續到現在？"] },
  fr: { AUDIENCE: ["Comment rencontrez-vous les arts et la culture ces temps-ci ?","Ces temps-ci, comment rencontrez-vous surtout les arts et la culture ?","Et concrètement, comment allez-vous voir des œuvres ou participer ?","Racontez un moment où votre manière de rencontrer les arts et la culture a changé.","S’il y a eu une période où vous alliez rarement voir des spectacles, des expositions ou des programmes, un intérêt continuait-il malgré tout ? Même par un autre chemin, cela compte.","Quelles réalités influencent aujourd’hui votre manière de rencontrer les arts et la culture ?","Quels appuis ou quels déclics vous ont permis d’aller vers les arts et la culture et d’en garder le souvenir ?"], EVERYDAY: ["Comment cette activité se poursuit-elle dans votre vie quotidienne ces temps-ci ?","Quelle description se rapproche le plus de la façon dont cette activité se poursuit aujourd’hui ?","Quelle description se rapproche le plus de la manière dont cette activité rencontre d’autres personnes par la pratique, les réunions, la performance ou le partage ?","Racontez une scène montrant comment ce changement s’est ressenti dans la pratique, les réunions, la performance ou le rythme quotidien.","S’il y a eu une période où cela ne se voyait guère au-dehors, y avait-il quelque chose que vous continuiez de faire ? Même une toute petite chose compte.","Quelles conditions quotidiennes et concrètes influencent le rythme de cette activité ?","Quelles personnes, quels lieux, apprentissages ou appuis de la vie ont aidé cette activité à continuer ?"], PROFESSIONAL: ["À quoi ressemble votre activité aujourd’hui, et quel lien entretient-elle avec l’extérieur ?","Où en est aujourd’hui votre activité artistique ou culturelle principale ?","Et aujourd’hui, comment cette activité rencontre-t-elle le public ?","Racontez une chose qui a changé à ce moment-là.","S’il y a eu une période où votre activité était peu visible de l’extérieur, y avait-il quelque chose que vous continuiez de faire ? Même si personne ne le savait, cela compte.","Quelles réalités influencent votre manière actuelle de travailler ?","Quels appuis ou quels déclics ont permis à votre activité de se poursuivre jusqu’ici ?"] },
  es: { AUDIENCE: ["Estos días, ¿cómo se acerca al arte y la cultura?","¿Qué opción describe mejor su manera de acercarse hoy al arte y la cultura?","¿Qué opción describe mejor cómo son, en la práctica, sus visitas y su participación?","Comparta un momento en que cambió su forma de acercarse al arte y la cultura.","Si hubo una época en que apenas iba a funciones, exposiciones o programas, ¿seguía teniendo algún interés entonces? No importa si siguió por otro camino.","¿Qué aspectos de su realidad influyen hoy en su manera de acercarse al arte y la cultura?","¿Qué base o qué impulso le ha llevado a buscar las artes y la cultura y a recordarlas?"], EVERYDAY: ["¿Cómo continúa esta actividad en su vida cotidiana estos días?","¿Qué descripción se acerca más a cómo continúa esta actividad estos días?","¿Qué descripción se acerca más a cómo esta actividad se encuentra con otras personas mediante la práctica, las reuniones, las actuaciones o las presentaciones?","Comparta una escena que muestre cómo se sintió ese cambio en la práctica, las reuniones, la presentación o el ritmo cotidiano.","Si hubo una época en que esta actividad apenas se notaba desde fuera, ¿había algo que seguía haciendo entonces? No importa si era algo muy pequeño.","¿Qué condiciones cotidianas y prácticas influyen en el ritmo de esta actividad?","¿Qué personas, espacios, aprendizajes o apoyos cotidianos han ayudado a continuar esta actividad?"], PROFESSIONAL: ["¿Cómo es hoy su actividad y cómo se relaciona con el exterior?","¿En qué situación se encuentra ahora su actividad artística o cultural más importante?","¿Qué opción describe mejor cómo se relaciona hoy esa actividad con el exterior?","Comparta una cosa que cambió en ese momento.","Si hubo una época en que su actividad apenas se veía desde fuera, ¿siguió haciendo algo entonces? No importa si nadie más lo sabía.","¿Qué aspectos de su realidad influyen hoy en su manera de trabajar?","¿Qué base o qué impulso le ha permitido seguir con su actividad hasta hoy?"] },
  nl: { AUDIENCE: ["Hoe komt u tegenwoordig in aanraking met kunst en cultuur?","Wat past het best bij hoe u nu met kunst en cultuur in aanraking komt?","Wat past het best bij hoe u in de praktijk gaat kijken en meedoet?","Vertel over één scène waarin u merkte dat u anders met kunst en cultuur in aanraking kwam.","Als er een tijd was waarin u zelden naar voorstellingen, tentoonstellingen of programma’s ging: bleef uw interesse toen toch bestaan? Ook als die via een andere weg doorging, telt het mee.","Welke omstandigheden beïnvloeden hoe u nu met kunst en cultuur in aanraking komt?","Wat bracht u ertoe kunst en cultuur op te zoeken en te onthouden? Welke basis, welke aanleiding?"], EVERYDAY: ["Hoe gaat deze activiteit tegenwoordig door in uw dagelijks leven?","Welke omschrijving past het best bij hoe deze activiteit nu doorgaat?","Welke omschrijving past het best bij hoe deze activiteit via oefenen, bijeenkomsten, optredens of delen andere mensen ontmoet?","Vertel één scène die laat zien hoe die verandering voelde in oefenen, bijeenkomsten, optreden of het dagelijkse ritme.","Als er een tijd was waarin het naar buiten toe weinig opviel, was er dan iets wat u toen bleef doen? Ook iets heel kleins telt mee.","Welke dagelijkse en praktische voorwaarden beïnvloeden het ritme van deze activiteit?","Welke mensen, ruimtes, vormen van leren of dagelijkse steun hielpen deze activiteit voort te zetten?"], PROFESSIONAL: ["Hoe ziet uw activiteit er nu uit, en hoe komt die naar buiten?","Hoe staat het nu met uw belangrijkste activiteit in kunst en cultuur?","Hoe komt die activiteit nu naar buiten?","Vertel één ding dat rond die tijd veranderde.","Als er een tijd was waarin uw werk van buitenaf nauwelijks te zien was: bleef u toen toch ergens mee bezig? Ook als niemand anders het wist, telt het mee.","Welke omstandigheden beïnvloeden hoe u nu werkt?","Wat heeft u geholpen om tot nu toe door te gaan? Welke basis, welke aanleiding?"] },
  ms: { AUDIENCE: ["Bagaimanakah anda bertemu seni dan budaya kebelakangan ini?","Yang manakah paling hampir dengan cara anda bertemu seni dan budaya sekarang?","Corak manakah yang paling hampir dengan cara anda sebenarnya menonton dan menyertai?","Kongsikan satu babak ketika cara anda bertemu seni dan budaya terasa berubah.","Jika pernah ada masa anda jarang pergi ke persembahan, pameran atau program, adakah minat yang tetap berterusan ketika itu? Tidak mengapa jika ia berterusan melalui jalan lain.","Apakah realiti yang mempengaruhi cara anda bertemu seni dan budaya sekarang?","Apakah asas atau pencetus yang membuat anda mencari dan mengingati seni dan budaya?"], EVERYDAY: ["Bagaimanakah kegiatan ini diteruskan dalam kehidupan harian anda kebelakangan ini?","Huraian manakah yang paling hampir dengan cara kegiatan ini diteruskan sekarang?","Huraian manakah yang paling hampir dengan cara kegiatan ini bertemu orang lain melalui latihan, pertemuan, persembahan atau perkongsian?","Kongsikan satu babak yang menunjukkan bagaimana perubahan itu dirasai dalam latihan, pertemuan, persembahan atau rentak harian.","Jika pernah ada masa ia tidak begitu ketara dari luar, adakah sesuatu yang anda terus lakukan ketika itu? Perkara yang sangat kecil pun dikira.","Apakah keadaan kehidupan dan realiti yang mempengaruhi rentak kegiatan ini?","Apakah orang, ruang, pembelajaran atau asas kehidupan yang membantu kegiatan ini berterusan?"], PROFESSIONAL: ["Bagaimanakah keadaan kegiatan anda sekarang, dan bagaimanakah ia berhubung dengan dunia luar?","Keadaan manakah yang paling hampir dengan kegiatan seni dan budaya utama anda sekarang?","Keadaan manakah yang paling hampir dengan cara kegiatan itu berhubung dengan dunia luar sekarang?","Kongsikan satu perkara yang berbeza sebelum dan selepas waktu itu.","Jika pernah ada masa kegiatan anda kurang kelihatan dari luar, adakah sesuatu yang tetap anda lakukan ketika itu? Tidak mengapa jika orang lain tidak mengetahuinya.","Apakah realiti yang sedang mempengaruhi cara anda bergiat sekarang?","Apakah asas atau pencetus yang membolehkan anda terus bergiat hingga kini?"] },
};

for (const [language, groups] of Object.entries(contextualLanguage)) {
  contextualCopy[language] = Object.fromEntries(Object.entries(groups).map(([kind, values]) => [kind, Object.fromEntries(["activityHeading", "p14", "p15", "p12", "p13", "p16", "p19"].map((key, index) => [key, values[index]]))]));
}
export function participantContextualCopy(language = "ko", kind = "PROFESSIONAL") {
  return contextualCopy[language]?.[kind] || contextualCopy.en[kind] || contextualCopy.ko.PROFESSIONAL;
}


// 2026-10-02(TK 「참여자의 모든 경우에 본인의 자리가 없게 느끼지 않게」): 분야 칸은 13칸 그대로 두고 설명 한 줄,
// 역할 이름은 그대로 두고 미술 쪽 말뿐이던 역할에 설명 한 줄. 한국어가 뜻의 기준이다.
const fieldDescriptions = {
  ko: { VISUAL_ARTS: "회화·드로잉·조각·판화·설치·서예", PHOTO_MEDIA: "사진·영상 작업·미디어아트", CRAFT_DESIGN: "도자·금속·섬유·목공 같은 공예, 디자인, 건축", FILM: "극영화·다큐멘터리·애니메이션·방송 영상", THEATRE_PERFORMANCE: "연극·뮤지컬·퍼포먼스·거리 공연", DANCE: "현대무용·발레·한국무용·스트리트 댄스", MUSIC: "클래식·대중음악·작곡·사운드", TRADITIONAL_ARTS: "국악·전통무용·연희·전통 공예와 문화", LITERATURE_PUBLISHING: "시·소설·수필·희곡·만화·웹툰·출판", HERITAGE_ARCHIVE: "문화유산·아카이브·지역의 기록", INTERDISCIPLINARY: "여러 장르를 넘나들거나 섞는 작업", LOCAL_EVERYDAY_CULTURE: "동호회·생활예술·마을과 지역의 문화 활동" },
  en: { VISUAL_ARTS: "painting, drawing, sculpture, printmaking, installation, calligraphy", PHOTO_MEDIA: "photography, moving image, media art", CRAFT_DESIGN: "crafts such as ceramics, metal, textile and wood; design; architecture", FILM: "fiction film, documentary, animation, broadcast video", THEATRE_PERFORMANCE: "theatre, musicals, performance, street performance", DANCE: "contemporary dance, ballet, Korean dance, street dance", MUSIC: "classical, popular music, composition, sound", TRADITIONAL_ARTS: "traditional music and dance, folk performance, traditional crafts and culture", LITERATURE_PUBLISHING: "poetry, fiction, essays, plays, comics, webtoons, publishing", HERITAGE_ARCHIVE: "cultural heritage, archives, local records", INTERDISCIPLINARY: "work that crosses or mixes several genres", LOCAL_EVERYDAY_CULTURE: "clubs, everyday arts, cultural activities in neighbourhoods and local areas" },
  ja: { VISUAL_ARTS: "絵画・ドローイング・彫刻・版画・インスタレーション・書", PHOTO_MEDIA: "写真・映像作品・メディアアート", CRAFT_DESIGN: "陶芸・金工・染織・木工などの工芸、デザイン、建築", FILM: "劇映画・ドキュメンタリー・アニメーション・放送映像", THEATRE_PERFORMANCE: "演劇・ミュージカル・パフォーマンス・路上パフォーマンス", DANCE: "コンテンポラリーダンス・バレエ・韓国舞踊・ストリートダンス", MUSIC: "クラシック・ポピュラー音楽・作曲・サウンド", TRADITIONAL_ARTS: "伝統音楽・伝統舞踊・民俗芸能・伝統工芸と文化", LITERATURE_PUBLISHING: "詩・小説・随筆・戯曲・漫画・ウェブトゥーン・出版", HERITAGE_ARCHIVE: "文化遺産・アーカイブ・地域の記録", INTERDISCIPLINARY: "いくつものジャンルを行き来したり、混ぜ合わせたりする制作", LOCAL_EVERYDAY_CULTURE: "サークル・暮らしの中の芸術・まちや地域の文化活動" },
  "zh-Hans": { VISUAL_ARTS: "绘画、素描、雕塑、版画、装置、书法", PHOTO_MEDIA: "摄影、影像创作、媒体艺术", CRAFT_DESIGN: "陶艺、金工、纤维、木工等工艺，以及设计与建筑", FILM: "剧情片、纪录片、动画、电视影像", THEATRE_PERFORMANCE: "戏剧、音乐剧、行为表演、街头表演", DANCE: "现代舞、芭蕾、韩国舞、街舞", MUSIC: "古典音乐、流行音乐、作曲、声音艺术", TRADITIONAL_ARTS: "传统音乐、传统舞蹈、民俗表演、传统工艺与文化", LITERATURE_PUBLISHING: "诗、小说、散文、剧本、漫画、网络漫画、出版", HERITAGE_ARCHIVE: "文化遗产、档案、地方记录", INTERDISCIPLINARY: "跨越或融合多种门类的创作", LOCAL_EVERYDAY_CULTURE: "兴趣社团、生活艺术、社区与地方的文化活动" },
  "zh-Hant": { VISUAL_ARTS: "繪畫、素描、雕塑、版畫、裝置、書法", PHOTO_MEDIA: "攝影、影像創作、媒體藝術", CRAFT_DESIGN: "陶藝、金工、織品、木工等工藝，以及設計、建築", FILM: "劇情片、紀錄片、動畫、電視影像", THEATRE_PERFORMANCE: "戲劇、音樂劇、表演藝術、街頭表演", DANCE: "現代舞、芭蕾、韓國舞、街舞", MUSIC: "古典音樂、流行音樂、作曲、聲音", TRADITIONAL_ARTS: "傳統音樂、傳統舞蹈、民俗表演、傳統工藝與文化", LITERATURE_PUBLISHING: "詩、小說、散文、劇本、漫畫、網路漫畫、出版", HERITAGE_ARCHIVE: "文化遺產、檔案、地方記錄", INTERDISCIPLINARY: "跨越或融合多種類型的創作", LOCAL_EVERYDAY_CULTURE: "社團、生活藝術、社區與地方的文化活動" },
  fr: { VISUAL_ARTS: "peinture, dessin, sculpture, gravure, installation, calligraphie", PHOTO_MEDIA: "photographie, vidéo, arts numériques", CRAFT_DESIGN: "céramique, métal, textile, bois et autres métiers d’art, design, architecture", FILM: "fiction, documentaire, animation, télévision", THEATRE_PERFORMANCE: "théâtre, comédie musicale, performance, arts de la rue", DANCE: "danse contemporaine, ballet, danse coréenne, danse urbaine", MUSIC: "musique classique, musiques actuelles, composition, création sonore", TRADITIONAL_ARTS: "musique et danse traditionnelles, arts populaires, artisanat et culture traditionnels", LITERATURE_PUBLISHING: "poésie, roman, essai, écriture dramatique, bande dessinée, webtoon, édition", HERITAGE_ARCHIVE: "patrimoine culturel, archives, mémoire locale", INTERDISCIPLINARY: "un travail qui traverse ou mêle plusieurs genres", LOCAL_EVERYDAY_CULTURE: "associations, pratiques amateurs, vie culturelle du quartier et de la région" },
  es: { VISUAL_ARTS: "pintura, dibujo, escultura, grabado, instalación, caligrafía", PHOTO_MEDIA: "fotografía, imagen en movimiento, arte de los medios", CRAFT_DESIGN: "cerámica, metal, textil, madera y otras artesanías; diseño; arquitectura", FILM: "ficción, documental, animación, televisión", THEATRE_PERFORMANCE: "teatro, musical, performance, artes de calle", DANCE: "danza contemporánea, ballet, danza coreana, danza urbana", MUSIC: "música clásica, música popular, composición, sonido", TRADITIONAL_ARTS: "música tradicional, danza tradicional, artes escénicas populares, artesanía y cultura tradicionales", LITERATURE_PUBLISHING: "poesía, narrativa, ensayo, dramaturgia, cómic, webtoon, edición", HERITAGE_ARCHIVE: "patrimonio cultural, archivos, memoria local", INTERDISCIPLINARY: "trabajos que cruzan varios géneros o los mezclan", LOCAL_EVERYDAY_CULTURE: "grupos de aficionados, arte amateur, cultura de barrio y de la localidad" },
  nl: { VISUAL_ARTS: "schilderkunst, tekenen, beeldhouwkunst, grafiek, installatie, kalligrafie", PHOTO_MEDIA: "fotografie, bewegend beeld, mediakunst", CRAFT_DESIGN: "ambacht zoals keramiek, metaal, textiel en hout; ontwerp; architectuur", FILM: "speelfilm, documentaire, animatie, televisieproducties", THEATRE_PERFORMANCE: "theater, musical, performance, straattheater", DANCE: "hedendaagse dans, ballet, Koreaanse dans, streetdance", MUSIC: "klassiek, popmuziek, compositie, geluid", TRADITIONAL_ARTS: "traditionele muziek en dans, volkskunst, traditioneel ambacht en cultuur", LITERATURE_PUBLISHING: "poëzie, proza, essay, toneelschrijven, strips, webtoons, uitgeven", HERITAGE_ARCHIVE: "cultureel erfgoed, archieven, lokale geschiedenis", INTERDISCIPLINARY: "werk dat meerdere genres overschrijdt of mengt", LOCAL_EVERYDAY_CULTURE: "verenigingen, amateurkunst, culturele activiteiten in buurt en regio" },
  ms: { VISUAL_ARTS: "lukisan, lakaran, arca, seni cetak, instalasi, kaligrafi", PHOTO_MEDIA: "fotografi, karya video, seni media", CRAFT_DESIGN: "kraf seperti seramik, logam, tekstil dan kayu; reka bentuk; seni bina", FILM: "filem cereka, dokumentari, animasi, video penyiaran", THEATRE_PERFORMANCE: "teater, muzikal, seni persembahan, persembahan jalanan", DANCE: "tarian kontemporari, balet, tarian Korea, tarian jalanan", MUSIC: "muzik klasik, muzik popular, gubahan, seni bunyi", TRADITIONAL_ARTS: "muzik dan tarian tradisional, persembahan rakyat, kraf dan budaya tradisional", LITERATURE_PUBLISHING: "puisi, cereka, esei, skrip drama, komik, webtoon, penerbitan", HERITAGE_ARCHIVE: "warisan budaya, arkib, rekod setempat", INTERDISCIPLINARY: "karya yang merentas atau menggabungkan beberapa genre", LOCAL_EVERYDAY_CULTURE: "kelab, seni harian, kegiatan budaya kejiranan dan setempat" },
};

const roleDescriptions = {
  ko: { G1: "작품을 만들거나, 무대에서 연주·연기·춤으로 펼치는 일", R05: "공연·축제·프로젝트를 기획하고 꾸리는 일", R14: "갤러리·소극장·연습실·책방 같은 작은 공간", R15: "미술관·공연장·문화재단·도서관 같은 기관", R19: "갤러리·기획사·음반과 책의 유통, 후원", R18: "설치·무대·조명·음향·영상 기술", R16: "학교·학원·문화센터의 수업과 강습" },
  en: { G1: "making work, or bringing it to life on stage by playing, acting or dancing", R05: "planning and running performances, festivals and projects", R14: "small spaces such as galleries, small theatres, rehearsal rooms and bookshops", R15: "institutions such as museums, performance venues, cultural foundations and libraries", R19: "galleries, agencies, distribution of recordings and books, patronage", R18: "installation, stage, lighting, sound and video technology", R16: "classes and lessons at schools, academies and community centres" },
  ja: { G1: "作品をつくる、または舞台で演奏・演技・ダンスを披露する仕事", R05: "公演・フェスティバル・プロジェクトを企画し、運営する仕事", R14: "ギャラリー・小劇場・稽古場・書店のような小さな空間", R15: "美術館・劇場・文化財団・図書館のような機関", R19: "ギャラリー・事務所・音源や本の流通、支援", R18: "設営・舞台・照明・音響・映像の技術", R16: "学校・教室・文化センターでの授業やレッスン" },
  "zh-Hans": { G1: "创作作品，或在舞台上以演奏、表演、舞蹈呈现", R05: "策划并运营演出、节庆与项目", R14: "画廊、小剧场、排练室、书店这样的小空间", R15: "美术馆、剧场、文化基金会、图书馆这样的机构", R19: "画廊、经纪公司、唱片与图书的流通，以及赞助", R18: "布展、舞台、灯光、音响、影像技术", R16: "在学校、补习班、文化中心授课与教学" },
  "zh-Hant": { G1: "創作作品，或在舞台上演奏、演戲、跳舞", R05: "策劃並營運演出、節慶與專案", R14: "畫廊、小劇場、排練室、書店這樣的小空間", R15: "美術館、劇場、文化基金會、圖書館這樣的機構", R19: "畫廊、經紀公司、唱片與圖書的流通，以及贊助", R18: "布展、舞台、燈光、音響、影像技術", R16: "在學校、補習班、文化中心授課與教學" },
  fr: { G1: "créer des œuvres, ou les faire vivre sur scène par la musique, le jeu ou la danse", R05: "concevoir et mener des spectacles, des festivals et des projets", R14: "petits lieux comme des galeries, petites salles, salles de répétition et librairies", R15: "institutions comme des musées, salles de spectacle, fondations culturelles et bibliothèques", R19: "galeries, agences, diffusion de disques et de livres, mécénat", R18: "technique d’installation, de plateau, de lumière, de son et de vidéo", R16: "cours et ateliers dans les écoles, académies et centres culturels" },
  es: { G1: "crear obras, o darles vida en escena tocando, actuando o bailando", R05: "idear y gestionar espectáculos, festivales y proyectos", R14: "espacios pequeños como galerías, salas pequeñas, salas de ensayo y librerías", R15: "instituciones como museos, teatros, fundaciones culturales y bibliotecas", R19: "galerías, agencias, distribución de discos y libros, mecenazgo", R18: "técnica de montaje, escenario, iluminación, sonido y vídeo", R16: "clases y talleres en escuelas, academias y centros culturales" },
  nl: { G1: "werk maken, of het op het podium tot leven brengen door spelen, acteren of dansen", R05: "voorstellingen, festivals en projecten bedenken en organiseren", R14: "kleine ruimtes zoals galeries, kleine zalen, repetitieruimtes en boekwinkels", R15: "instellingen zoals musea, theaters, cultuurfondsen en bibliotheken", R19: "galeries, bureaus, distributie van muziek en boeken, mecenaat", R18: "techniek voor opbouw, podium, licht, geluid en video", R16: "lessen en cursussen op scholen, academies en cultuurcentra" },
  ms: { G1: "menghasilkan karya, atau mempersembahkannya di pentas melalui muzik, lakonan atau tarian", R05: "merancang dan menjalankan persembahan, festival dan projek", R14: "ruang kecil seperti galeri, teater kecil, bilik latihan dan kedai buku", R15: "institusi seperti muzium seni, dewan persembahan, yayasan kebudayaan dan perpustakaan", R19: "galeri, agensi, pengedaran rakaman dan buku, serta penajaan", R18: "teknologi pemasangan, pentas, pencahayaan, bunyi dan video", R16: "kelas dan pelajaran di sekolah, pusat tuisyen dan pusat kebudayaan" },
};

export function participantFieldDescriptions(language = "ko") { return fieldDescriptions[language] || fieldDescriptions.en; }
export function participantRoleDescriptions(language = "ko") { return roleDescriptions[language] || roleDescriptions.en; }

// 홍콩판(zh-Hant-HK)은 번체에서 만든다 — hong-kong.js(2026-10-01).
// contextualCopy 는 위 반복문이 contextualLanguage 에서 이미 만들었으므로 그쪽에 붙인다.
[base, labels, activityScreenCopy, dContextHintCopy, contextualCopy, fieldDescriptions, roleDescriptions].forEach(withHongKong);
