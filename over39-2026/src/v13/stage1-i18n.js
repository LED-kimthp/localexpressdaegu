// Stage 1 additions deliberately live apart from the historical question
// dictionary. Every supported language has its own copy; zh-Hans and zh-Hant
// are never aliases of one another.
const copy = {
  ko: {
    introEyebrow: "대화로 남기는 문화예술의 시간", introTitle: "당신의 이야기를 천천히 듣고 싶습니다.",
    introLead: "이 설문은 문화예술과 함께 살아온 한 사람의 시간을 대화와 편지의 흐름으로 기록합니다.",
    introFlow: "처음에는 지금 어떤 방식으로 문화예술과 함께하고 있는지 살피고, 이어서 기억·현재의 변화·계속 이어가기 위한 조건을 당신의 말로 듣습니다.",
    introRecord: "답변은 마지막에 하나의 참여 기록으로 정리됩니다. 이후에는 서로 다른 기록 사이에서 지금 당신과 이어지는 한 사람의 안부를 만날 수 있습니다.",
    ready: "잠시 자신의 이야기에 집중할 수 있을 때 시작해주세요.", durationPending: "예상 소요시간은 실제 참여 시간 측정 뒤 안내합니다.",
    identityHelp: "이름, 닉네임, 이니셜 가운데 편한 표기를 적어주세요. 이어지는 대화와 참여 기록에서 이 표기를 사용합니다.",
    identityPrivacy: "안부에서 다른 사람에게 어떤 이름으로 보일지는 나중에 다시 선택할 수 있습니다. 익명으로 참여해도 괜찮습니다.",
    contextTitle: "지금의 문화예술 활동을 조금 더 알려주세요.", contextHelp: "이 정보는 당신을 분류하기 위한 것이 아니라, 다음 질문을 활동의 언어와 현재의 조건에 맞추고 안부의 연결 이유를 이해하기 위한 맥락입니다.", roleBridgeTitle: "지금의 역할을 한 번만 확인할게요.", roleBridgeHelp: "앞에서 고른 활동 맥락과 과거 응답의 역할 분류를 연결하기 위한 확인입니다. 가장 가까운 역할 하나를 고르고, 함께하는 역할은 원할 때만 남겨주세요.", roleBridgePrimaryOther: "이번 활동을 가장 자연스럽게 설명하는 역할을 적어주세요.", roleBridgeParallelOther: "함께 이어지는 다른 역할이 있다면 적어주세요.",
    optional: "선택 사항", addAnother: "다른 항목도 함께 고르기", oneOrMore: "가까운 항목을 하나 이상 골라주세요.",
    previousAnswer: "앞서 남긴 말", followingQuestion: "이어지는 질문", aiNotice: "앞서 남긴 답변의 맥락을 바탕으로 AI가 이어지는 질문을 만들었습니다.",
    recordSavedTitle: "응답을 남겨주셔서 감사합니다.", recordSavedLead: "지금까지의 답변은 하나의 참여 기록으로 정리되었습니다.", recordSavedNext: "이제 이 기록을 어떤 범위에서 연구에 사용할지 선택하고, 당신에게 이어지는 안부를 확인할 수 있습니다.",
    referenceLabel: "참여 기록 코드", referenceHelp: "이 코드는 나중에 기록을 찾을 때 사용하는 표기입니다. 이 코드만으로는 응답이나 연락처를 열 수 없습니다.",
    receiveFirst: "도착한 안부가 있으면 먼저 읽고, 그다음 다음 사람에게 남길 한 문장을 맡길 수 있습니다.",
    waitingGreeting: "아직 당신에게 도착한 이전 안부가 없어요. 당신이 첫 안부를 시작할 수 있습니다.",
    notificationTitle: "다음 안부가 도착했을 때 이메일로 알려드릴까요?", notificationHelp: "이 이메일은 새로운 안부가 도착했을 때 안부함 링크를 보내는 데만 사용합니다.",
    referralTitle: "다음 참여자에게 프로젝트 전하기", referralHelp: "여러 이메일 주소를 한 번에 붙여 넣어도 괜찮아요. 쉼표, 띄어쓰기, 줄바꿈이 섞여 있어도 주소를 정리한 뒤 발송 전에 보여드립니다.",
    parseAddresses: "주소 정리하기", parsedAddresses: "찾은 주소", duplicatesRemoved: "중복 제외", invalidAddresses: "확인이 필요한 주소", sendInvitation: "{count}명에게 안내 보내기",
    groups: { field: ["만들고 표현하는 분야", "무대와 화면의 분야", "글·기록·유산의 분야", "지역과 생활의 분야"], mode: ["만들고 표현하는 활동", "기획하고 연결하는 활동", "연구하고 기록하는 활동", "배우고 가르치며 이어가는 활동"] },
  },
  en: {
    introEyebrow: "A cultural arts life, recorded through conversation", introTitle: "We would like to listen to your story slowly.",
    introLead: "This survey records one person’s time with arts and culture through a flow of conversation and letters.",
    introFlow: "We first look at how arts and culture are part of your life now. Then we listen, in your own words, to memory, present change, and the conditions that make continuation possible.",
    introRecord: "Your responses become one participation record at the end. You may then encounter a greeting from someone whose record connects with yours.",
    ready: "Please begin when you have a little time to focus on your own story.", durationPending: "An estimated duration will be shown after human participation times have been measured.",
    identityHelp: "Write the name, nickname, or initials that feel comfortable. We use this label in the conversation and participation record.",
    identityPrivacy: "You can later choose how, if at all, a name appears to another person in a greeting. Joining anonymously is welcome.",
    contextTitle: "Tell us a little more about your arts and culture activity today.", contextHelp: "This information does not place you in a type. It helps us use language that fits your activity and conditions in the next questions, and understand why a greeting may connect.", roleBridgeTitle: "One quick check on your current role.", roleBridgeHelp: "This links the activity context you just chose with the role categories used in earlier responses. Choose the closest main role; add parallel roles only if useful.", roleBridgePrimaryOther: "Describe the role that best fits this activity.", roleBridgeParallelOther: "Add another role that continues alongside it, if any.",
    optional: "Optional", addAnother: "Add another item", oneOrMore: "Choose one or more items that feel close.",
    previousAnswer: "What you said earlier", followingQuestion: "A question that follows", aiNotice: "AI created this next question from the context of what you wrote earlier.",
    recordSavedTitle: "Thank you for leaving your responses.", recordSavedLead: "Your answers have been gathered into one participation record.", recordSavedNext: "You can now choose how this record may be used in research and check for a greeting connected with you.",
    referenceLabel: "Participation record code", referenceHelp: "This code helps you recognise your record later. The code alone cannot open your responses or contact details.",
    receiveFirst: "If a greeting has arrived, you can read it first and then entrust one sentence for the next person.",
    waitingGreeting: "No earlier greeting has reached you yet. You can begin the first greeting.",
    notificationTitle: "Would you like an email when another greeting arrives?", notificationHelp: "This email is used only to send a mailbox link when a new greeting arrives.",
    referralTitle: "Share the project with the next participants", referralHelp: "You may paste several email addresses at once. Commas, spaces, and line breaks are all fine; we will organise them and show them before sending.",
    parseAddresses: "Organise addresses", parsedAddresses: "Addresses found", duplicatesRemoved: "Duplicates removed", invalidAddresses: "Addresses to check", sendInvitation: "Send an invitation to {count} people",
    groups: { field: ["Making and expressive fields", "Stage and screen fields", "Writing, record, and heritage fields", "Local and everyday fields"], mode: ["Making and performing", "Planning and connecting", "Researching and recording", "Learning, teaching, and continuing"] },
  },
  ja: {
    introEyebrow: "対話で残す文化芸術の時間", introTitle: "あなたの話をゆっくり聞かせてください。", introLead: "この調査は、文化芸術とともに生きてきた一人の時間を、対話と手紙の流れとして記録します。", introFlow: "最初に今どのように文化芸術と関わっているかをたずね、その後、記憶・現在の変化・続けるための条件をあなたの言葉で聞きます。", introRecord: "回答は最後に一つの参加記録になります。その後、記録がつながる誰かからのあいさつに出会えることがあります。", ready: "少しだけ自分の話に集中できる時に始めてください。", durationPending: "所要時間は実際の参加時間を測定してから案内します。", identityHelp: "名前、ニックネーム、イニシャルのうち心地よい表記を書いてください。対話と参加記録で使います。", identityPrivacy: "あいさつで他の人にどの名前を見せるかは後で選べます。匿名での参加も歓迎します。", contextTitle: "今の文化芸術活動についてもう少し教えてください。", contextHelp: "これはあなたを類型化するための情報ではありません。次の質問を活動の言葉と今の条件に合わせ、あいさつがつながる理由を理解するための文脈です。", roleBridgeTitle: "今の役割を一度だけ確認します。", roleBridgeHelp: "先ほど選んだ活動の文脈と、過去の回答で使ってきた役割分類をつなぐための確認です。最も近い主な役割を一つ選び、並行する役割は必要な場合だけ残してください。", roleBridgePrimaryOther: "今回の活動を最も自然に表す役割を書いてください。", roleBridgeParallelOther: "並行して続いている別の役割があれば書いてください。", optional: "任意", addAnother: "別の項目も選ぶ", oneOrMore: "近い項目を一つ以上選んでください。", previousAnswer: "先ほど残した言葉", followingQuestion: "続く質問", aiNotice: "先ほど書いた答えの文脈をもとに、AIが続く質問を作りました。", recordSavedTitle: "回答を残してくださり、ありがとうございます。", recordSavedLead: "ここまでの答えは一つの参加記録にまとめられました。", recordSavedNext: "この記録を研究で使う範囲を選び、あなたにつながるあいさつを確認できます。", referenceLabel: "参加記録コード", referenceHelp: "このコードは後で記録を探すための表記です。コードだけで回答や連絡先は開けません。", receiveFirst: "届いたあいさつがあれば先に読み、その後で次の人へ渡す一文を託せます。", waitingGreeting: "まだあなたに届いた以前のあいさつはありません。最初のあいさつを始められます。", notificationTitle: "次のあいさつが届いた時にメールで知らせますか？", notificationHelp: "このメールは新しいあいさつが届いた時に、あいさつ箱へのリンクを送るためだけに使います。", referralTitle: "次の参加者にプロジェクトを伝える", referralHelp: "複数のメールアドレスを一度に貼り付けられます。カンマ、空白、改行が混ざっていても、送信前に整理して表示します。", parseAddresses: "アドレスを整理する", parsedAddresses: "見つかったアドレス", duplicatesRemoved: "重複を除外", invalidAddresses: "確認が必要なアドレス", sendInvitation: "{count}人に案内を送る", groups: { field: ["つくり表現する分野", "舞台と映像の分野", "文章・記録・文化遺産の分野", "地域と生活の分野"], mode: ["つくり表現する活動", "企画しつなぐ活動", "研究し記録する活動", "学び教え続ける活動"] } },
  "zh-Hans": {
    introEyebrow: "以对话留下的文化艺术时光", introTitle: "我们想慢慢听你讲述自己的故事。", introLead: "这份问卷以对话与书信的脉络，记录一个人与文化艺术共同生活的时间。", introFlow: "我们先了解文化艺术现在如何进入你的生活，再用你的话聆听记忆、当下的变化，以及继续下去需要的条件。", introRecord: "最后，回答会成为一份参与记录。之后你可能会遇到一则与自己记录相连的问候。", ready: "请在能稍微专注于自己故事的时候开始。", durationPending: "将在测量实际参与时间后提供预计时长。", identityHelp: "请写下你觉得舒服的姓名、昵称或姓名缩写。它会用于后续对话和参与记录。", identityPrivacy: "之后你可以再选择问候中是否、以及如何向他人显示名字。欢迎匿名参与。", contextTitle: "请再多告诉我们一些你现在的文化艺术活动。", contextHelp: "这些信息不是为了把你归类。它帮助我们用贴近你的活动和当下条件的语言继续提问，并理解一则问候为何可能连接到你。", roleBridgeTitle: "我们只再确认一次你现在的角色。", roleBridgeHelp: "这一步把你刚才选择的活动语境与过去回答中使用的角色分类连接起来。请选择最接近的主要角色；其他并行角色仅在需要时填写。", roleBridgePrimaryOther: "请写下最自然地描述这项活动的角色。", roleBridgeParallelOther: "如有同时持续的其他角色，可以写在这里。", optional: "可选", addAnother: "再选一项", oneOrMore: "请选择一个或多个接近你的项目。", previousAnswer: "你刚才留下的话", followingQuestion: "接续的问题", aiNotice: "AI 根据你刚才所写内容的语境，生成了这个接续问题。", recordSavedTitle: "感谢你留下回答。", recordSavedLead: "你至今的回答已整理为一份参与记录。", recordSavedNext: "现在可以选择这份记录用于研究的范围，并查看是否有一则与你相连的问候。", referenceLabel: "参与记录代码", referenceHelp: "此代码帮助你日后辨认记录。代码本身不能打开你的回答或联系方式。", receiveFirst: "若已有问候抵达，你可以先阅读它，再托付一句话给下一位。", waitingGreeting: "还没有之前的问候抵达你这里。你可以开始第一则问候。", notificationTitle: "下一则问候抵达时，要通过电子邮件通知你吗？", notificationHelp: "此邮箱只用于在新问候抵达时发送信箱链接。", referralTitle: "把项目分享给下一位参与者", referralHelp: "可以一次粘贴多个邮箱地址。逗号、空格和换行混在一起也没关系；发送前我们会整理并显示。", parseAddresses: "整理地址", parsedAddresses: "找到的地址", duplicatesRemoved: "已去除重复", invalidAddresses: "需要确认的地址", sendInvitation: "向 {count} 人发送邀请", groups: { field: ["创作与表达领域", "舞台与影像领域", "写作、记录与遗产领域", "地方与日常领域"], mode: ["创作与表达活动", "策划与连接活动", "研究与记录活动", "学习、教学与持续活动"] } },
  "zh-Hant": {
    introEyebrow: "以對話留下的文化藝術時光", introTitle: "我們想慢慢聽你講述自己的故事。", introLead: "這份問卷以對話與書信的脈絡，記錄一個人與文化藝術共同生活的時間。", introFlow: "我們先了解文化藝術現在如何進入你的生活，再用你的話聆聽記憶、當下的變化，以及繼續下去需要的條件。", introRecord: "最後，回答會成為一份參與記錄。之後你可能會遇到一則與自己記錄相連的問候。", ready: "請在能稍微專注於自己故事的時候開始。", durationPending: "將在測量實際參與時間後提供預計時長。", identityHelp: "請寫下你覺得舒服的姓名、暱稱或姓名縮寫。它會用於後續對話和參與記錄。", identityPrivacy: "之後你可以再選擇問候中是否、以及如何向他人顯示名字。歡迎匿名參與。", contextTitle: "請再多告訴我們一些你現在的文化藝術活動。", contextHelp: "這些資訊不是為了把你歸類。它幫助我們用貼近你的活動和當下條件的語言繼續提問，並理解一則問候為何可能連結到你。", roleBridgeTitle: "我們只再確認一次你現在的角色。", roleBridgeHelp: "這一步把你剛才選擇的活動脈絡與過去回覆中使用的角色分類連接起來。請選擇最接近的主要角色；其他並行角色只在需要時填寫。", roleBridgePrimaryOther: "請寫下最自然地描述這項活動的角色。", roleBridgeParallelOther: "如有同時持續的其他角色，可以寫在這裡。", optional: "選填", addAnother: "再選一項", oneOrMore: "請選擇一個或多個接近你的項目。", previousAnswer: "你剛才留下的話", followingQuestion: "接續的問題", aiNotice: "AI 根據你剛才所寫內容的語境，生成了這個接續問題。", recordSavedTitle: "感謝你留下回答。", recordSavedLead: "你至今的回答已整理為一份參與記錄。", recordSavedNext: "現在可以選擇這份記錄用於研究的範圍，並查看是否有一則與你相連的問候。", referenceLabel: "參與記錄代碼", referenceHelp: "此代碼幫助你日後辨認記錄。代碼本身不能開啟你的回答或聯絡方式。", receiveFirst: "若已有問候抵達，你可以先閱讀它，再託付一句話給下一位。", waitingGreeting: "還沒有之前的問候抵達你這裡。你可以開始第一則問候。", notificationTitle: "下一則問候抵達時，要透過電子郵件通知你嗎？", notificationHelp: "此信箱只用於在新問候抵達時發送信箱連結。", referralTitle: "把專案分享給下一位參與者", referralHelp: "可以一次貼上多個電子郵件地址。逗號、空格和換行混在一起也沒關係；發送前我們會整理並顯示。", parseAddresses: "整理地址", parsedAddresses: "找到的地址", duplicatesRemoved: "已去除重複", invalidAddresses: "需要確認的地址", sendInvitation: "向 {count} 人發送邀請", groups: { field: ["創作與表達領域", "舞台與影像領域", "寫作、記錄與遺產領域", "地方與日常領域"], mode: ["創作與表達活動", "策劃與連結活動", "研究與記錄活動", "學習、教學與持續活動"] } },
  fr: {
    introEyebrow: "Un temps culturel et artistique, consigné par le dialogue", introTitle: "Nous aimerions écouter votre histoire lentement.", introLead: "Ce questionnaire consigne le temps vécu par une personne avec les arts et la culture, dans un mouvement de conversation et de lettres.", introFlow: "Nous regardons d’abord comment les arts et la culture vous accompagnent aujourd’hui, puis nous écoutons, avec vos mots, les souvenirs, les changements présents et les conditions pour continuer.", introRecord: "Vos réponses deviennent à la fin un dossier de participation. Vous pourrez ensuite rencontrer un message lié à votre propre dossier.", ready: "Commencez lorsque vous avez un moment pour vous concentrer sur votre histoire.", durationPending: "Une durée estimée sera indiquée après mesure des temps de participation réels.", identityHelp: "Indiquez le nom, le surnom ou les initiales qui vous conviennent. Cette mention sera utilisée dans le dialogue et le dossier de participation.", identityPrivacy: "Vous choisirez plus tard si et comment un nom apparaît dans un message adressé à une autre personne. La participation anonyme est bienvenue.", contextTitle: "Parlez-nous un peu plus de votre activité culturelle et artistique aujourd’hui.", contextHelp: "Ces informations ne servent pas à vous classer. Elles nous aident à ajuster les questions à votre activité et à vos conditions, et à comprendre pourquoi un message peut vous rejoindre.", roleBridgeTitle: "Une seule vérification de votre rôle actuel.", roleBridgeHelp: "Cette étape relie le contexte d’activité choisi juste avant aux catégories de rôles utilisées dans les réponses antérieures. Choisissez le rôle principal le plus proche ; ajoutez les rôles parallèles seulement si cela vous aide.", roleBridgePrimaryOther: "Décrivez le rôle qui correspond le mieux à cette activité.", roleBridgeParallelOther: "Ajoutez un autre rôle qui se poursuit en parallèle, s’il y en a un.", optional: "Facultatif", addAnother: "Ajouter un autre élément", oneOrMore: "Choisissez un ou plusieurs éléments proches de vous.", previousAnswer: "Vos mots précédents", followingQuestion: "Une question qui suit", aiNotice: "L’IA a créé cette question à partir du contexte de votre réponse précédente.", recordSavedTitle: "Merci d’avoir laissé vos réponses.", recordSavedLead: "Vos réponses ont été réunies dans un dossier de participation.", recordSavedNext: "Vous pouvez maintenant choisir le cadre de recherche et vérifier si un message vous est lié.", referenceLabel: "Code du dossier de participation", referenceHelp: "Ce code vous aide à reconnaître votre dossier plus tard. Il ne permet pas, à lui seul, d’ouvrir vos réponses ou vos coordonnées.", receiveFirst: "Si un message est arrivé, vous pouvez le lire d’abord, puis confier une phrase à la personne suivante.", waitingGreeting: "Aucun message précédent ne vous est encore arrivé. Vous pouvez commencer le premier message.", notificationTitle: "Souhaitez-vous un e-mail lorsqu’un autre message arrive ?", notificationHelp: "Cet e-mail sert uniquement à envoyer un lien vers la boîte aux messages lorsqu’un nouveau message arrive.", referralTitle: "Partager le projet avec les prochains participants", referralHelp: "Vous pouvez coller plusieurs adresses e-mail à la fois. Virgules, espaces et retours à la ligne sont acceptés ; elles seront organisées puis affichées avant l’envoi.", parseAddresses: "Organiser les adresses", parsedAddresses: "Adresses trouvées", duplicatesRemoved: "Doublons retirés", invalidAddresses: "Adresses à vérifier", sendInvitation: "Envoyer une invitation à {count} personnes", groups: { field: ["Domaines de création et d’expression", "Domaines de la scène et de l’écran", "Domaines de l’écrit, du document et du patrimoine", "Domaines locaux et quotidiens"], mode: ["Créer et se produire", "Concevoir et relier", "Rechercher et documenter", "Apprendre, transmettre et continuer"] } },
  es: {
    introEyebrow: "Un tiempo de artes y cultura registrado mediante conversación", introTitle: "Queremos escuchar su historia con calma.", introLead: "Esta encuesta registra el tiempo que una persona ha vivido con las artes y la cultura a través de una secuencia de conversación y cartas.", introFlow: "Primero vemos cómo las artes y la cultura forman parte de su vida hoy. Después escuchamos, con sus propias palabras, la memoria, los cambios presentes y las condiciones para continuar.", introRecord: "Al final, sus respuestas se convierten en un registro de participación. Después podrá encontrarse con un saludo conectado con su registro.", ready: "Empiece cuando tenga un momento para concentrarse en su propia historia.", durationPending: "La duración estimada se mostrará después de medir tiempos reales de participación.", identityHelp: "Escriba el nombre, apodo o iniciales con los que se sienta a gusto. Usaremos esta forma en el diálogo y en el registro de participación.", identityPrivacy: "Más adelante podrá elegir si un nombre aparece y cómo aparece para otra persona en un saludo. La participación anónima es bienvenida.", contextTitle: "Cuéntenos un poco más sobre su actividad artística y cultural actual.", contextHelp: "Esta información no sirve para clasificarle. Nos ayuda a usar un lenguaje adecuado para su actividad y condiciones en las preguntas siguientes, y a entender por qué un saludo puede conectar.", roleBridgeTitle: "Una sola comprobación de su papel actual.", roleBridgeHelp: "Este paso conecta el contexto de actividad que acaba de elegir con las categorías de roles usadas en respuestas anteriores. Elija el rol principal más cercano; añada roles paralelos solo si le resulta útil.", roleBridgePrimaryOther: "Describa el rol que mejor encaja con esta actividad.", roleBridgeParallelOther: "Añada otro rol que continúe en paralelo, si lo hay.", optional: "Opcional", addAnother: "Añadir otro elemento", oneOrMore: "Elija uno o más elementos cercanos a usted.", previousAnswer: "Lo que dijo antes", followingQuestion: "Una pregunta que sigue", aiNotice: "La IA creó esta pregunta a partir del contexto de lo que escribió antes.", recordSavedTitle: "Gracias por dejar sus respuestas.", recordSavedLead: "Sus respuestas se han reunido en un registro de participación.", recordSavedNext: "Ahora puede elegir cómo se utilizará este registro en la investigación y comprobar si hay un saludo conectado con usted.", referenceLabel: "Código del registro de participación", referenceHelp: "Este código le ayuda a reconocer su registro más adelante. El código por sí solo no puede abrir sus respuestas ni datos de contacto.", receiveFirst: "Si ha llegado un saludo, puede leerlo primero y después confiar una frase a la siguiente persona.", waitingGreeting: "Aún no ha llegado a usted ningún saludo anterior. Puede iniciar el primer saludo.", notificationTitle: "¿Desea un correo cuando llegue otro saludo?", notificationHelp: "Este correo se utiliza solo para enviar un enlace al buzón cuando llega un nuevo saludo.", referralTitle: "Compartir el proyecto con los próximos participantes", referralHelp: "Puede pegar varias direcciones de correo a la vez. Comas, espacios y saltos de línea están bien; las ordenaremos y mostraremos antes de enviar.", parseAddresses: "Ordenar direcciones", parsedAddresses: "Direcciones encontradas", duplicatesRemoved: "Duplicados eliminados", invalidAddresses: "Direcciones que revisar", sendInvitation: "Enviar una invitación a {count} personas", groups: { field: ["Campos de creación y expresión", "Campos de escena y pantalla", "Campos de escritura, registro y patrimonio", "Campos locales y cotidianos"], mode: ["Crear y actuar", "Planificar y conectar", "Investigar y registrar", "Aprender, enseñar y continuar"] } },
  nl: {
    introEyebrow: "Een cultureel-artistieke tijd, vastgelegd in gesprek", introTitle: "We willen graag rustig naar uw verhaal luisteren.", introLead: "Deze vragenlijst legt de tijd vast die iemand met kunst en cultuur heeft geleefd, in een stroom van gesprek en brieven.", introFlow: "Eerst kijken we hoe kunst en cultuur nu deel uitmaken van uw leven. Daarna luisteren we, in uw eigen woorden, naar herinnering, verandering in het heden en voorwaarden om door te gaan.", introRecord: "Uw antwoorden worden aan het eind één participatieverslag. Daarna kunt u een groet ontmoeten die met uw verslag verbonden is.", ready: "Begin wanneer u even aandacht voor uw eigen verhaal heeft.", durationPending: "Een geschatte duur wordt getoond nadat werkelijke deelnametijden zijn gemeten.", identityHelp: "Schrijf de naam, bijnaam of initialen die goed voelen. Deze aanduiding gebruiken we in het gesprek en het participatieverslag.", identityPrivacy: "U kiest later of en hoe een naam voor iemand anders zichtbaar wordt in een groet. Anoniem deelnemen is welkom.", contextTitle: "Vertel ons iets meer over uw huidige kunst- en cultuuractiviteit.", contextHelp: "Deze informatie deelt u niet in een type in. Zij helpt ons de volgende vragen aan te laten sluiten bij uw activiteit en omstandigheden, en te begrijpen waarom een groet kan verbinden.", roleBridgeTitle: "Nog één korte check van uw huidige rol.", roleBridgeHelp: "Deze stap verbindt de activiteitscontext die u net koos met de rolcategorieën uit eerdere antwoorden. Kies de best passende hoofdrol; voeg parallelle rollen alleen toe als dat nuttig is.", roleBridgePrimaryOther: "Beschrijf de rol die het best bij deze activiteit past.", roleBridgeParallelOther: "Voeg een andere rol toe die daarnaast doorloopt, als die er is.", optional: "Optioneel", addAnother: "Nog een item toevoegen", oneOrMore: "Kies één of meer items die dichtbij voelen.", previousAnswer: "Wat u eerder zei", followingQuestion: "Een vervolgvraag", aiNotice: "AI maakte deze vervolgvraag vanuit de context van wat u eerder schreef.", recordSavedTitle: "Dank u voor uw antwoorden.", recordSavedLead: "Uw antwoorden zijn samengebracht in één participatieverslag.", recordSavedNext: "U kunt nu kiezen hoe dit verslag in onderzoek wordt gebruikt en kijken of er een groet met u verbonden is.", referenceLabel: "Code van het participatieverslag", referenceHelp: "Deze code helpt u uw verslag later te herkennen. Alleen met de code kunnen uw antwoorden of contactgegevens niet worden geopend.", receiveFirst: "Als er een groet is aangekomen, kunt u die eerst lezen en daarna één zin toevertrouwen aan de volgende persoon.", waitingGreeting: "Er is nog geen eerdere groet bij u aangekomen. U kunt de eerste groet beginnen.", notificationTitle: "Wilt u een e-mail wanneer een volgende groet aankomt?", notificationHelp: "Dit e-mailadres gebruiken we alleen om een mailboxlink te sturen wanneer een nieuwe groet aankomt.", referralTitle: "Deel het project met volgende deelnemers", referralHelp: "U kunt meerdere e-mailadressen tegelijk plakken. Komma’s, spaties en regeleinden zijn prima; we ordenen en tonen ze vóór verzending.", parseAddresses: "Adressen ordenen", parsedAddresses: "Gevonden adressen", duplicatesRemoved: "Dubbele verwijderd", invalidAddresses: "Te controleren adressen", sendInvitation: "Stuur een uitnodiging aan {count} mensen", groups: { field: ["Velden van maken en expressie", "Velden van podium en scherm", "Velden van schrijven, archief en erfgoed", "Lokale en alledaagse velden"], mode: ["Maken en optreden", "Plannen en verbinden", "Onderzoeken en vastleggen", "Leren, onderwijzen en doorgaan"] } },
  ms: {
    introEyebrow: "Masa seni dan budaya yang dirakam melalui perbualan", introTitle: "Kami ingin mendengar cerita anda dengan perlahan.", introLead: "Soal selidik ini merakam masa seseorang hidup bersama seni dan budaya melalui aliran perbualan dan surat.", introFlow: "Mula-mula kami melihat bagaimana seni dan budaya hadir dalam hidup anda sekarang. Kemudian kami mendengar, dengan kata-kata anda sendiri, ingatan, perubahan semasa dan syarat untuk meneruskan.", introRecord: "Jawapan anda akan menjadi satu rekod penyertaan pada akhirnya. Selepas itu anda mungkin bertemu satu salam yang berkait dengan rekod anda.", ready: "Mulakan apabila anda mempunyai sedikit masa untuk menumpukan perhatian pada cerita sendiri.", durationPending: "Anggaran masa akan dipaparkan selepas masa penyertaan sebenar diukur.", identityHelp: "Tulis nama, nama panggilan atau inisial yang selesa. Kami menggunakan sebutan ini dalam perbualan dan rekod penyertaan.", identityPrivacy: "Kemudian anda boleh memilih sama ada dan bagaimana nama dipaparkan kepada orang lain dalam salam. Penyertaan tanpa nama dialu-alukan.", contextTitle: "Ceritakan sedikit lagi tentang kegiatan seni dan budaya anda hari ini.", contextHelp: "Maklumat ini bukan untuk mengelaskan anda. Ia membantu kami menggunakan bahasa yang sesuai dengan kegiatan dan keadaan anda dalam soalan seterusnya, serta memahami sebab salam mungkin bersambung.", roleBridgeTitle: "Satu semakan ringkas tentang peranan anda sekarang.", roleBridgeHelp: "Langkah ini menghubungkan konteks kegiatan yang baru anda pilih dengan kategori peranan yang digunakan dalam jawapan terdahulu. Pilih satu peranan utama yang paling dekat; tambah peranan selari hanya jika berguna.", roleBridgePrimaryOther: "Terangkan peranan yang paling sesuai dengan kegiatan ini.", roleBridgeParallelOther: "Tambah peranan lain yang berterusan bersama, jika ada.", optional: "Pilihan", addAnother: "Tambah satu lagi", oneOrMore: "Pilih satu atau lebih perkara yang dekat dengan anda.", previousAnswer: "Kata-kata anda sebelum ini", followingQuestion: "Soalan yang bersambung", aiNotice: "AI membina soalan susulan ini berdasarkan konteks jawapan yang anda tulis sebelum ini.", recordSavedTitle: "Terima kasih kerana meninggalkan jawapan anda.", recordSavedLead: "Jawapan anda telah dihimpunkan sebagai satu rekod penyertaan.", recordSavedNext: "Kini anda boleh memilih cara rekod ini digunakan dalam penyelidikan dan melihat sama ada ada salam yang berkait dengan anda.", referenceLabel: "Kod rekod penyertaan", referenceHelp: "Kod ini membantu anda mengenali rekod kemudian. Kod sahaja tidak boleh membuka jawapan atau maklumat hubungan anda.", receiveFirst: "Jika ada salam yang telah tiba, anda boleh membacanya dahulu dan kemudian mengamanahkan satu ayat kepada orang seterusnya.", waitingGreeting: "Belum ada salam terdahulu yang tiba kepada anda. Anda boleh memulakan salam pertama.", notificationTitle: "Mahukah anda menerima e-mel apabila salam seterusnya tiba?", notificationHelp: "E-mel ini hanya digunakan untuk menghantar pautan peti surat apabila salam baharu tiba.", referralTitle: "Kongsi projek dengan peserta seterusnya", referralHelp: "Anda boleh menampal beberapa alamat e-mel sekali gus. Koma, ruang dan baris baharu tidak menjadi masalah; kami akan menyusunnya dan menunjukkannya sebelum dihantar.", parseAddresses: "Susun alamat", parsedAddresses: "Alamat ditemui", duplicatesRemoved: "Pendua dikeluarkan", invalidAddresses: "Alamat untuk diperiksa", sendInvitation: "Hantar jemputan kepada {count} orang", groups: { field: ["Bidang penciptaan dan ekspresi", "Bidang pentas dan skrin", "Bidang penulisan, rekod dan warisan", "Bidang tempatan dan harian"], mode: ["Mencipta dan mempersembah", "Merancang dan menghubungkan", "Menyelidik dan merekod", "Belajar, mengajar dan meneruskan"] } },
 };

const entryCopy = {
  ko: {
    introAudience: "전문 예술가가 아니어도 괜찮습니다. 만들고, 기획하고, 가르치고, 배우고, 생활 속에서 참여하거나 관객으로 기억해온 경험 모두 이 연구의 일부입니다.",
    introAi: "일부 서술형 답변에서는 앞서 쓴 말을 바탕으로 AI가 이어지는 질문을 만들 수 있고, 마지막 참여 기록의 초안을 정리하는 데에도 사용됩니다. 기록은 직접 읽고 고칠 수 있습니다.",
    introVoluntary: "참여는 자발적입니다. 답하기 어려운 질문은 건너뛸 수 있고, 언제든 중단할 수 있습니다.",
    consentTitle: "참여와 AI 사용 안내를 확인해주세요.",
    consentHelp: "연구 참여와 일부 후속 질문·참여 기록 초안에 쓰이는 AI 사용을 각각 확인한 뒤 시작합니다.",
    consentResearch: "이 연구의 목적과 참여 방식을 확인했습니다. 자발적으로 참여합니다.",
    consentAi: "일부 서술형 답변을 바탕으로 AI가 후속 질문과 참여 기록 초안을 만드는 데 사용될 수 있음을 확인했습니다.",
    consentVoluntary: "답하기 어려운 질문은 건너뛸 수 있고, 언제든 참여를 중단할 수 있습니다.",
    openCallSecondary: "공모는 설문 참여와 별개의 선택입니다. 연구를 마친 뒤에도 확인할 수 있습니다.",
  },
  en: {
    introAudience: "You do not need to be a professional artist. Making, planning, teaching, learning, everyday participation, and experiences as an audience member are all part of this research.",
    introAi: "For some written responses, AI may create a follow-up question from what you wrote and help draft the participation record at the end. You can read and edit the record yourself.",
    introVoluntary: "Participation is voluntary. You may skip questions that are difficult to answer and stop at any time.",
    consentTitle: "Please review participation and AI use before you begin.",
    consentHelp: "Please acknowledge research participation and the use of AI for some follow-up questions and the participation-record draft separately.",
    consentResearch: "I have reviewed the purpose and participation process of this research and choose to take part voluntarily.",
    consentAi: "I understand that some written responses may be processed by AI to create follow-up questions and a draft participation record.",
    consentVoluntary: "You may skip difficult questions and stop participating at any time.",
    openCallSecondary: "The open call is separate from the survey. You can also review it after finishing the research.",
  },
  ja: {
    introAudience: "専門の芸術家でなくても参加できます。つくること、企画すること、教えること、学ぶこと、暮らしの中での参加、観客として記憶してきた経験も、この調査の一部です。",
    introAi: "一部の記述回答では、書かれた言葉をもとにAIが続く質問を作り、最後の参加記録の下書きを整えるためにも使われます。記録はご自身で読み、直すことができます。",
    introVoluntary: "参加は任意です。答えにくい質問は飛ばすことができ、いつでも中止できます。",
    consentTitle: "参加とAI利用について確認してください。",
    consentHelp: "調査への参加と、一部の追加質問・参加記録の下書きに使うAI利用をそれぞれ確認してから始めます。",
    consentResearch: "この調査の目的と参加方法を確認し、自分の意思で参加します。",
    consentAi: "一部の記述回答をもとに、AIが追加質問と参加記録の下書きを作る場合があることを確認しました。",
    consentVoluntary: "答えにくい質問は飛ばすことができ、いつでも参加を中止できます。",
    openCallSecondary: "公募は調査への参加とは別の選択です。調査を終えた後にも確認できます。",
  },
  "zh-Hans": {
    introAudience: "不需要是专业艺术家。创作、策划、教学、学习、日常参与，以及作为观众留下的经验，都是这项研究的一部分。",
    introAi: "对于部分文字回答，AI可能会根据你写下的内容生成后续问题，也会帮助整理最后的参与记录草稿。你可以亲自阅读并修改记录。",
    introVoluntary: "参与完全自愿。难以回答的问题可以跳过，也可以随时停止参与。",
    consentTitle: "开始前，请确认参与方式与AI使用说明。",
    consentHelp: "请分别确认研究参与，以及AI用于部分后续问题和参与记录草稿的方式。",
    consentResearch: "我已了解本研究的目的与参与方式，并自愿参加。",
    consentAi: "我已了解，部分文字回答可能由AI处理，用于生成后续问题和参与记录草稿。",
    consentVoluntary: "难以回答的问题可以跳过，也可以随时停止参与。",
    openCallSecondary: "公开征集与问卷参与相互独立。完成研究后也可以再查看。",
  },
  "zh-Hant": {
    introAudience: "不需要是專業藝術家。創作、策劃、教學、學習、日常參與，以及作為觀眾留下的經驗，都是這項研究的一部分。",
    introAi: "對於部分文字回答，AI可能會根據你寫下的內容生成後續問題，也會協助整理最後的參與記錄草稿。你可以親自閱讀並修改記錄。",
    introVoluntary: "參與完全自願。難以回答的問題可以跳過，也可以隨時停止參與。",
    consentTitle: "開始前，請確認參與方式與AI使用說明。",
    consentHelp: "請分別確認研究參與，以及AI用於部分後續問題和參與記錄草稿的方式。",
    consentResearch: "我已了解本研究的目的與參與方式，並自願參加。",
    consentAi: "我已了解，部分文字回答可能由AI處理，用於生成後續問題和參與記錄草稿。",
    consentVoluntary: "難以回答的問題可以跳過，也可以隨時停止參與。",
    openCallSecondary: "公開徵集與問卷參與相互獨立。完成研究後也可以再查看。",
  },
  fr: {
    introAudience: "Il n’est pas nécessaire d’être artiste professionnel. Créer, organiser, enseigner, apprendre, participer au quotidien ou garder des souvenirs en tant que public font aussi partie de cette recherche.",
    introAi: "Pour certaines réponses écrites, l’IA peut formuler une question de suivi à partir de vos mots et aider à préparer le brouillon du dossier de participation final. Vous pourrez lire et modifier ce dossier vous-même.",
    introVoluntary: "La participation est volontaire. Vous pouvez passer les questions difficiles et arrêter à tout moment.",
    consentTitle: "Avant de commencer, veuillez vérifier les informations sur la participation et l’usage de l’IA.",
    consentHelp: "Nous vous demandons de confirmer séparément votre participation à la recherche et l’usage de l’IA pour certaines questions de suivi et le brouillon du dossier de participation.",
    consentResearch: "J’ai pris connaissance de l’objectif et du déroulement de cette recherche et je choisis d’y participer volontairement.",
    consentAi: "Je comprends que certaines réponses écrites peuvent être traitées par l’IA afin de créer des questions de suivi et un brouillon du dossier de participation.",
    consentVoluntary: "Vous pouvez passer les questions difficiles et arrêter votre participation à tout moment.",
    openCallSecondary: "L’appel à projets est distinct du questionnaire. Vous pourrez aussi le consulter après la recherche.",
  },
  es: {
    introAudience: "No es necesario ser artista profesional. Crear, organizar, enseñar, aprender, participar en la vida cotidiana o recordar experiencias como público también forman parte de esta investigación.",
    introAi: "En algunas respuestas escritas, la IA puede crear una pregunta de seguimiento a partir de sus palabras y ayudar a preparar el borrador del registro de participación final. Usted podrá leer y editar el registro.",
    introVoluntary: "La participación es voluntaria. Puede omitir las preguntas difíciles y detenerse en cualquier momento.",
    consentTitle: "Antes de empezar, revise la información sobre participación y uso de IA.",
    consentHelp: "Confirme por separado la participación en la investigación y el uso de IA para algunas preguntas de seguimiento y el borrador del registro de participación.",
    consentResearch: "He revisado el propósito y el proceso de esta investigación y elijo participar voluntariamente.",
    consentAi: "Entiendo que algunas respuestas escritas pueden ser procesadas por IA para crear preguntas de seguimiento y un borrador del registro de participación.",
    consentVoluntary: "Puede omitir las preguntas difíciles y dejar de participar en cualquier momento.",
    openCallSecondary: "La convocatoria es independiente de la encuesta. También podrá consultarla después de terminar la investigación.",
  },
  nl: {
    introAudience: "U hoeft geen professionele kunstenaar te zijn. Maken, organiseren, lesgeven, leren, dagelijks deelnemen en ervaringen als publiek horen allemaal bij dit onderzoek.",
    introAi: "Bij sommige geschreven antwoorden kan AI vanuit uw woorden een vervolgvraag maken en helpen met een concept van het uiteindelijke participatieverslag. U kunt het verslag zelf lezen en aanpassen.",
    introVoluntary: "Deelname is vrijwillig. U kunt moeilijke vragen overslaan en op elk moment stoppen.",
    consentTitle: "Bekijk vóór u begint de informatie over deelname en AI-gebruik.",
    consentHelp: "Bevestig afzonderlijk deelname aan het onderzoek en het gebruik van AI voor sommige vervolgvragen en het concept van het participatieverslag.",
    consentResearch: "Ik heb het doel en de werkwijze van dit onderzoek bekeken en kies ervoor vrijwillig deel te nemen.",
    consentAi: "Ik begrijp dat sommige geschreven antwoorden door AI kunnen worden verwerkt om vervolgvragen en een concept van het participatieverslag te maken.",
    consentVoluntary: "U kunt moeilijke vragen overslaan en op elk moment stoppen met deelnemen.",
    openCallSecondary: "De open oproep staat los van de enquête. U kunt die ook bekijken nadat u het onderzoek hebt afgerond.",
  },
  ms: {
    introAudience: "Anda tidak perlu menjadi artis profesional. Mencipta, merancang, mengajar, belajar, penyertaan harian dan pengalaman sebagai penonton semuanya sebahagian daripada penyelidikan ini.",
    introAi: "Bagi sesetengah jawapan bertulis, AI boleh menghasilkan soalan susulan daripada kata-kata anda dan membantu menyediakan draf rekod penyertaan akhir. Anda boleh membaca dan menyunting rekod itu sendiri.",
    introVoluntary: "Penyertaan adalah secara sukarela. Anda boleh melangkau soalan yang sukar dan berhenti pada bila-bila masa.",
    consentTitle: "Sebelum bermula, sila semak maklumat penyertaan dan penggunaan AI.",
    consentHelp: "Sila sahkan secara berasingan penyertaan penyelidikan dan penggunaan AI untuk sesetengah soalan susulan serta draf rekod penyertaan.",
    consentResearch: "Saya telah menyemak tujuan dan proses penyelidikan ini dan memilih untuk mengambil bahagian secara sukarela.",
    consentAi: "Saya memahami bahawa sesetengah jawapan bertulis boleh diproses oleh AI untuk menghasilkan soalan susulan dan draf rekod penyertaan.",
    consentVoluntary: "Anda boleh melangkau soalan yang sukar dan berhenti mengambil bahagian pada bila-bila masa.",
    openCallSecondary: "Panggilan terbuka adalah berasingan daripada soal selidik. Anda juga boleh melihatnya selepas menamatkan penyelidikan.",
  },
};

// FINAL GOLD keeps the settled landing voice together so every locale follows
// the Korean semantic source without changing the research or greeting model.
const finalGoldCopy = {
  ko: {
    projectMeta: "리서치 · 참여 기록 · 안부",
    introEyebrow: "대화로 남기는 문화예술의 시간",
    introTitle: "당신의 이야기를 천천히 듣고 싶습니다.",
    introLead: "이 설문은 문화예술과 함께 살아온 한 사람의 시간을 천천히 묻고 기록합니다.",
    introAudience: "전문 예술가가 아니어도 괜찮습니다. 만들고, 기획하고, 가르치고, 배우고, 생활 속에서 참여하거나 관객으로 함께해온 경험까지 듣습니다.",
    introFlow: "기억에 남은 장면에서 시작해, 지금의 변화와 앞으로도 이어가기 위해 필요한 조건을 차례로 살펴봅니다.",
    introRecord: "당신이 남긴 기록은 하나의 참여 기록으로 정리됩니다. 직접 읽고 다듬은 뒤, 원한다면 이곳을 먼저 지나간 한 사람이 남긴 안부 한 통을 받아볼 수 있습니다.",
    introAi: "설문을 진행하는 동안, AI가 필요한 경우 두세 번까지 질문을 더 건넬 수 있습니다. 참여 기록의 초안은 AI가 정리하고, 당신이 직접 읽어보며 문장을 다듬을 수 있습니다.",
    introVoluntary: "참여는 자발적입니다. 답하기 어려운 질문은 건너뛰어도 되고, 언제든 멈출 수 있습니다.",
    ready: "잠시 자신의 이야기에 집중할 수 있을 때 시작해주세요.",
    durationPending: "예상 소요시간은 실제 참여 시간을 확인한 뒤 안내할 예정입니다.",
    researchCardDescription: "기억에 남은 장면에서 시작해, 지금의 변화와 앞으로 이어가기 위해 필요한 조건까지 천천히 듣습니다.",
  },
  en: {
    projectMeta: "Research · participation record · greeting",
    introEyebrow: "A cultural arts life, recorded through conversation",
    introTitle: "We would like to listen to your story slowly.",
    introLead: "This survey slowly asks about and records the time of one person who has lived with arts and culture.",
    introAudience: "You do not need to be a professional artist. We listen to experiences of making, planning, teaching, learning, taking part in everyday life, and sharing as an audience member.",
    introFlow: "Starting from a scene that stays in your memory, we look in order at changes now and the conditions needed to continue.",
    introRecord: "What you leave is organised as one participation record. After reading and refining it yourself, you may, if you wish, receive a greeting left by someone who passed through here before you.",
    introAi: "During the survey, AI may ask one or two more questions when needed. AI organises a draft of the participation record, and you can read it yourself and refine the sentences.",
    introVoluntary: "Participation is voluntary. You may skip questions that are difficult to answer and stop at any time.",
    ready: "Please begin when you have a little time to focus on your own story.",
    durationPending: "An estimated duration will be provided after actual participation times have been reviewed.",
    researchCardDescription: "Starting from a scene that stays in your memory, we listen slowly to changes now and the conditions needed to continue.",
  },
  ja: {
    projectMeta: "リサーチ · 参加記録 · あいさつ",
    introEyebrow: "対話で残す文化芸術の時間",
    introTitle: "あなたの話をゆっくり聞かせてください。",
    introLead: "この調査は、文化芸術とともに生きてきた一人の時間を、ゆっくりたずねて記録します。",
    introAudience: "専門の芸術家でなくても大丈夫です。つくること、企画すること、教えること、学ぶこと、暮らしの中での参加、観客としてともにしてきた経験まで聞きます。",
    introFlow: "記憶に残る場面から始め、今の変化と、これからも続けるために必要な条件を順に見ていきます。",
    introRecord: "残した言葉は一つの参加記録にまとめられます。自分で読んで整えた後、希望すれば、先にここを通った一人が残したあいさつを一通受け取れます。",
    introAi: "調査の途中で、必要な場合にAIが一、二度、質問を加えることがあります。参加記録の下書きはAIが整え、あなた自身が読みながら文章を直せます。",
    introVoluntary: "参加は任意です。答えにくい質問は飛ばしてもよく、いつでも止められます。",
    ready: "少し自分の話に集中できる時に始めてください。",
    durationPending: "所要時間の目安は、実際の参加時間を確認した後に案内します。",
    researchCardDescription: "記憶に残る場面から始め、今の変化と、これから続けるために必要な条件までゆっくり聞きます。",
  },
  "zh-Hans": {
    projectMeta: "研究 · 参与记录 · 问候",
    introEyebrow: "以对话留下文化艺术的时光",
    introTitle: "我们想慢慢听你讲述自己的故事。",
    introLead: "这份问卷慢慢询问并记录一个人与文化艺术共同生活的时光。",
    introAudience: "不需要是专业艺术家。我们也倾听创作、策划、教学、学习、日常参与，以及作为观众一路相伴的经验。",
    introFlow: "从记忆中的一个场景开始，依次看看当下的变化，以及今后继续下去所需的条件。",
    introRecord: "你留下的内容会整理成一份参与记录。亲自阅读并修改后，如你愿意，可以收到一则由先经过这里的人留下的问候。",
    introAi: "问卷进行期间，AI会在需要时多问一两次。参与记录的草稿由AI整理，你可以亲自阅读并调整句子。",
    introVoluntary: "参与完全自愿。难以回答的问题可以跳过，也可以随时停止。",
    ready: "请在能够暂时专注于自己故事的时候开始。",
    durationPending: "预计用时将在确认实际参与时间后提供。",
    researchCardDescription: "从记忆中的一个场景开始，慢慢听你讲述当下的变化，以及今后继续下去所需的条件。",
  },
  "zh-Hant": {
    projectMeta: "研究 · 參與記錄 · 問候",
    introEyebrow: "以對話留下文化藝術的時光",
    introTitle: "我們想慢慢聽你說自己的故事。",
    introLead: "這份問卷慢慢詢問並記錄一個人與文化藝術共同生活的時光。",
    introAudience: "不需要是專業藝術家。我們也聆聽創作、策劃、教學、學習、日常參與，以及作為觀眾一路相伴的經驗。",
    introFlow: "從記憶中的一個場景開始，依序看看當下的變化，以及今後繼續下去所需的條件。",
    introRecord: "你留下的內容會整理成一份參與記錄。親自閱讀並修改後，如你願意，可以收到一則由先經過這裡的人留下的問候。",
    introAi: "問卷進行期間，AI會在需要時多問一兩次。參與記錄的草稿由AI整理，你可以親自閱讀並調整句子。",
    introVoluntary: "參與完全自願。難以回答的問題可以跳過，也可以隨時停止。",
    ready: "請在能夠暫時專注於自己故事的時候開始。",
    durationPending: "預計所需時間將在確認實際參與時間後提供。",
    researchCardDescription: "從記憶中的一個場景開始，慢慢聽你說當下的變化，以及今後繼續下去所需的條件。",
  },
  fr: {
    projectMeta: "Recherche · récit de participation · salutation",
    introEyebrow: "Le temps des arts et de la culture, laissé par le dialogue",
    introTitle: "Nous aimerions écouter votre histoire, lentement.",
    introLead: "Ce questionnaire interroge et consigne avec attention le parcours d’une personne qui a vécu avec les arts et la culture.",
    introAudience: "Il n’est pas nécessaire d’être artiste professionnel. Nous écoutons aussi les expériences de création, d’organisation, d’enseignement, d’apprentissage, de participation au quotidien et de présence comme public.",
    introFlow: "À partir d’une scène restée en mémoire, nous regardons successivement les changements actuels et les conditions nécessaires pour continuer.",
    introRecord: "Ce que vous laissez est organisé en un récit de participation. Après l’avoir lu et ajusté vous-même, vous pourrez, si vous le souhaitez, recevoir une salutation laissée par une personne passée ici avant vous.",
    introAi: "Pendant le questionnaire, l’IA peut poser une ou deux questions supplémentaires lorsque c’est nécessaire. Elle organise un brouillon du récit de participation, que vous pouvez lire et reformuler vous-même.",
    introVoluntary: "La participation est volontaire. Vous pouvez passer les questions difficiles et arrêter à tout moment.",
    ready: "Commencez lorsque vous pouvez consacrer un moment à votre propre histoire.",
    durationPending: "Une durée indicative sera donnée après vérification des temps de participation réels.",
    researchCardDescription: "À partir d’une scène restée en mémoire, nous écoutons avec attention les changements actuels et les conditions nécessaires pour continuer.",
  },
  es: {
    projectMeta: "Investigación · registro de participación · saludo",
    introEyebrow: "El tiempo de las artes y la cultura, registrado mediante conversación",
    introTitle: "Queremos escuchar su historia con calma.",
    introLead: "Esta encuesta pregunta y registra con calma el tiempo de una persona que ha vivido junto a las artes y la cultura.",
    introAudience: "No es necesario ser artista profesional. También escuchamos experiencias de crear, organizar, enseñar, aprender, participar en la vida cotidiana y acompañar como público.",
    introFlow: "Partimos de una escena que permanece en la memoria y revisamos, en orden, los cambios actuales y las condiciones necesarias para continuar.",
    introRecord: "Lo que deje se organizará como un registro de participación. Después de leerlo y ajustarlo usted mismo, si lo desea, podrá recibir un saludo dejado por alguien que pasó antes por aquí.",
    introAi: "Durante la encuesta, la IA puede hacer una o dos preguntas más cuando sea necesario. La IA organiza un borrador del registro de participación y usted puede leerlo y ajustar las frases.",
    introVoluntary: "La participación es voluntaria. Puede omitir las preguntas difíciles y detenerse en cualquier momento.",
    ready: "Comience cuando pueda concentrarse un momento en su propia historia.",
    durationPending: "El tiempo estimado se indicará después de revisar los tiempos reales de participación.",
    researchCardDescription: "Partiendo de una escena que permanece en la memoria, escuchamos con calma los cambios actuales y las condiciones necesarias para continuar.",
  },
  nl: {
    projectMeta: "Onderzoek · participatieverslag · groet",
    introEyebrow: "Tijd met kunst en cultuur, vastgelegd in gesprek",
    introTitle: "We willen rustig naar uw verhaal luisteren.",
    introLead: "Deze vragenlijst vraagt rustig naar de tijd van iemand die met kunst en cultuur heeft geleefd en legt die vast.",
    introAudience: "U hoeft geen professionele kunstenaar te zijn. We luisteren ook naar ervaringen met maken, organiseren, lesgeven, leren, dagelijks deelnemen en aanwezig zijn als publiek.",
    introFlow: "Vanuit een scène die in uw herinnering bleef, bekijken we achtereenvolgens veranderingen nu en de voorwaarden die nodig zijn om door te gaan.",
    introRecord: "Wat u achterlaat wordt geordend als één participatieverslag. Nadat u het zelf hebt gelezen en aangepast, kunt u desgewenst een groet ontvangen van iemand die hier eerder langskwam.",
    introAi: "Tijdens de vragenlijst kan AI zo nodig één of twee extra vragen stellen. AI ordent een concept van het participatieverslag, waarna u de zinnen zelf kunt lezen en aanpassen.",
    introVoluntary: "Deelname is vrijwillig. U kunt moeilijke vragen overslaan en op elk moment stoppen.",
    ready: "Begin wanneer u even aandacht aan uw eigen verhaal kunt geven.",
    durationPending: "Een geschatte duur wordt gegeven nadat werkelijke deelnametijden zijn bekeken.",
    researchCardDescription: "Vanuit een scène die in uw herinnering bleef, luisteren we rustig naar veranderingen nu en de voorwaarden die nodig zijn om door te gaan.",
  },
  ms: {
    projectMeta: "Penyelidikan · rekod penyertaan · salam",
    introEyebrow: "Masa seni dan budaya yang dirakam melalui perbualan",
    introTitle: "Kami ingin mendengar cerita anda dengan perlahan.",
    introLead: "Soal selidik ini bertanya dan merakam dengan perlahan masa seseorang yang hidup bersama seni dan budaya.",
    introAudience: "Anda tidak perlu menjadi artis profesional. Kami turut mendengar pengalaman mencipta, merancang, mengajar, belajar, menyertai kehidupan harian dan hadir sebagai penonton.",
    introFlow: "Bermula daripada adegan yang kekal dalam ingatan, kami melihat perubahan semasa dan keadaan yang diperlukan untuk terus meneruskan, satu demi satu.",
    introRecord: "Apa yang anda tinggalkan akan disusun sebagai satu rekod penyertaan. Selepas membacanya dan memperhalus ayat sendiri, jika mahu, anda boleh menerima salam yang ditinggalkan oleh seseorang yang melalui tempat ini lebih dahulu.",
    introAi: "Semasa soal selidik, AI boleh mengemukakan satu atau dua soalan tambahan apabila diperlukan. AI menyusun draf rekod penyertaan, dan anda boleh membacanya serta memperhalus ayat sendiri.",
    introVoluntary: "Penyertaan adalah secara sukarela. Anda boleh melangkau soalan yang sukar dan berhenti pada bila-bila masa.",
    ready: "Mulakan apabila anda dapat memberi sedikit tumpuan kepada cerita sendiri.",
    durationPending: "Anggaran masa akan diberikan selepas masa penyertaan sebenar disemak.",
    researchCardDescription: "Bermula daripada adegan yang kekal dalam ingatan, kami mendengar dengan perlahan perubahan semasa dan keadaan yang diperlukan untuk terus meneruskan.",
  },
};

const task5Copy = {
  ko: { mMixed: "여러 이유가 함께 있음", mUnsure: "아직 한 가지 이유로 정하기 어려움", p16None: "현재 특별히 영향을 주는 조건이 없음", p16Unsure: "아직 잘 모르겠음", dNoGap: "현재 특별히 큰 간극은 없음", dNoChange: "지금 특정한 변화가 필요하다고 느끼지 않음", dUnsure: "아직 잘 모르겠음", noAxisMemory: "이번 기록에서는 기억의 한 방향을 정하지 않음", noAxisCondition: "이번 기록에서는 조건의 한 방향을 정하지 않음" },
  en: { mMixed: "Several reasons are present together", mUnsure: "I cannot place it in one reason yet", p16None: "No particular condition is strongly affecting this now", p16Unsure: "Not sure yet", dNoGap: "No major gap feels especially important now", dNoChange: "I do not currently feel a specific change is needed", dUnsure: "Not sure yet", noAxisMemory: "Leave the memory direction open in this record", noAxisCondition: "Leave the condition direction open in this record" },
  ja: { mMixed: "いくつかの理由が重なっている", mUnsure: "まだ一つの理由に決めにくい", p16None: "今とくに強く影響している条件はない", p16Unsure: "まだよく分からない", dNoGap: "今とくに大きな隔たりはない", dNoChange: "今は特定の変化が必要だとは感じていない", dUnsure: "まだよく分からない", noAxisMemory: "この記録では記憶の方向を一つに決めない", noAxisCondition: "この記録では条件の方向を一つに決めない" },
  "zh-Hans": { mMixed: "几个原因同时存在", mUnsure: "暂时难以归为一个原因", p16None: "目前没有特别强烈影响我的条件", p16Unsure: "暂时不确定", dNoGap: "目前没有特别明显的主要缺口", dNoChange: "目前没有感觉需要某一项具体改变", dUnsure: "暂时不确定", noAxisMemory: "这份记录暂不确定单一记忆方向", noAxisCondition: "这份记录暂不确定单一条件方向" },
  "zh-Hant": { mMixed: "幾個原因同時存在", mUnsure: "暫時難以歸為一個原因", p16None: "目前沒有特別強烈影響我的條件", p16Unsure: "暫時不確定", dNoGap: "目前沒有特別明顯的主要缺口", dNoChange: "目前沒有感覺需要某一項具體改變", dUnsure: "暫時不確定", noAxisMemory: "這份記錄暫不確定單一記憶方向", noAxisCondition: "這份記錄暫不確定單一條件方向" },
  fr: { mMixed: "Plusieurs raisons sont présentes ensemble", mUnsure: "Difficile de choisir une seule raison pour l'instant", p16None: "Aucune condition particulière n'agit fortement en ce moment", p16Unsure: "Je ne sais pas encore", dNoGap: "Aucun écart majeur ne ressort actuellement", dNoChange: "Je ne ressens pas actuellement le besoin d'un changement précis", dUnsure: "Je ne sais pas encore", noAxisMemory: "Laisser ouverte la direction de la mémoire dans ce récit", noAxisCondition: "Laisser ouverte la direction des conditions dans ce récit" },
  es: { mMixed: "Hay varias razones al mismo tiempo", mUnsure: "Todavía es difícil elegir una sola razón", p16None: "Ahora no hay una condición concreta que influya especialmente", p16Unsure: "Todavía no lo sé", dNoGap: "Ahora no percibo una brecha principal especialmente grande", dNoChange: "Ahora no siento que haga falta un cambio específico", dUnsure: "Todavía no lo sé", noAxisMemory: "Dejar abierta la dirección de la memoria en este registro", noAxisCondition: "Dejar abierta la dirección de las condiciones en este registro" },
  nl: { mMixed: "Meerdere redenen spelen tegelijk", mUnsure: "Nog moeilijk om één reden te kiezen", p16None: "Er is nu geen specifieke voorwaarde die sterk meespeelt", p16Unsure: "Nog niet zeker", dNoGap: "Er voelt nu geen bijzonder grote kloof", dNoChange: "Ik voel nu geen behoefte aan één specifieke verandering", dUnsure: "Nog niet zeker", noAxisMemory: "Laat de richting van herinnering in dit verslag open", noAxisCondition: "Laat de richting van voorwaarden in dit verslag open" },
  ms: { mMixed: "Beberapa sebab hadir bersama", mUnsure: "Masih sukar memilih satu sebab", p16None: "Tiada keadaan khusus yang sangat mempengaruhi sekarang", p16Unsure: "Masih belum pasti", dNoGap: "Tiada jurang utama yang terasa sangat besar sekarang", dNoChange: "Saya tidak merasakan perubahan khusus diperlukan sekarang", dUnsure: "Masih belum pasti", noAxisMemory: "Biarkan arah ingatan terbuka dalam rekod ini", noAxisCondition: "Biarkan arah keadaan terbuka dalam rekod ini" },
};

export function stage1Copy(language = "ko") {
  const base = copy[language] || copy.en;
  return { ...base, ...(entryCopy[language] || entryCopy.en), ...(finalGoldCopy[language] || finalGoldCopy.en), task5: task5Copy[language] || task5Copy.en };
}

export const STAGE1_SUPPORTED_LANGUAGES = Object.freeze(Object.keys(copy));

const greetingVisibility = {
  ko: ["이름 또는 선택한 표기를 보여줘도 괜찮아요", "역할·지역 정도만 보여주세요", "익명으로 남길게요"],
  en: ["You may show my chosen name or label", "Show only broad context such as role or region", "Leave this greeting anonymous"],
  ja: ["選んだ名前や表記を見せてもよいです", "役割・地域程度だけを見せてください", "匿名で残します"],
  "zh-Hans": ["可以显示我选择的姓名或标记", "只显示角色、地区等概括背景", "匿名留下这则问候"],
  "zh-Hant": ["可以顯示我選擇的姓名或標記", "只顯示角色、地區等概括背景", "匿名留下這則問候"],
  fr: ["Vous pouvez montrer le nom ou la mention que j’ai choisi", "Montrer seulement un contexte général, comme le rôle ou la région", "Laisser ce message de façon anonyme"],
  es: ["Puede mostrar mi nombre o etiqueta elegida", "Muestre solo un contexto general, como rol o región", "Deje este saludo de forma anónima"],
  nl: ["U mag mijn gekozen naam of aanduiding tonen", "Toon alleen brede context zoals rol of regio", "Laat deze groet anoniem achter"],
  ms: ["Anda boleh memaparkan nama atau sebutan pilihan saya", "Paparkan konteks umum sahaja seperti peranan atau wilayah", "Tinggalkan salam ini tanpa nama"],
};

export function greetingVisibilityCopy(language = "ko") {
  return greetingVisibility[language] || greetingVisibility.en;
}

const consent = {
  ko: { title: "이 기록의 사용 범위를 직접 정해주세요.", help: "각 선택은 서로 다른 목적에만 적용되며, 미리 선택되어 있지 않습니다.", researchQ: "이 응답을 연락처와 분리해 연구 분석에 포함해도 괜찮을까요? 참여 기록에 남긴 표기는 기록과 함께 보관하며, 분석 결과에는 쓰지 않습니다.", researchYes: "네, 익명 분석에 사용해도 괜찮아요.", researchNo: "아니요, 연구 분석에는 포함하지 말아주세요.", quoteQ: "남겨주신 문장 일부를 이름 없이 연구자료에 인용해도 괜찮을까요?", quoteYes: "네, 이름 없이 일부 문장을 인용해도 괜찮아요.", quoteNo: "아니요, 개별 문장은 인용하지 말아주세요.", publicQ: "전시·출판·웹 등에 이 기록을 소개할 일이 생기면 그때 다시 연락드려도 괜찮을까요?", publicYes: "네, 필요할 때 다시 확인해주세요.", publicNo: "아니요, 이번 기록은 연구 범위에서 마무리해주세요." },
  en: { title: "Please choose the scope for using this record.", help: "Each choice applies only to its own purpose. Nothing is selected in advance.", researchQ: "May this response be included in research analysis, kept separate from your contact details? The display label you left on the record stays with the record and is not used in analysis results.", researchYes: "Yes, it may be used in anonymous analysis.", researchNo: "No, please do not include it in research analysis.", quoteQ: "May part of what you wrote be quoted anonymously in research material?", quoteYes: "Yes, parts may be quoted without my name.", quoteNo: "No, please do not quote individual sentences.", publicQ: "If there is a future opportunity to introduce this record in an exhibition, publication, or on the web, may we contact you again then?", publicYes: "Yes, please ask again when it is needed.", publicNo: "No, please finish this record within the research scope." },
  ja: { title: "この記録を使う範囲を自分で選んでください。", help: "それぞれの選択は別の目的だけに適用され、あらかじめ選ばれていません。", researchQ: "名前と連絡先を除いた研究分析にこの回答を含めてもよいですか？", researchYes: "はい、匿名の分析に使ってよいです。", researchNo: "いいえ、研究分析には含めないでください。", quoteQ: "残した文章の一部を名前なしで研究資料に引用してもよいですか？", quoteYes: "はい、名前なしで一部を引用してよいです。", quoteNo: "いいえ、個別の文章は引用しないでください。", publicQ: "展示・出版・ウェブでこの記録を紹介する機会があれば、その時にあらためて連絡してもよいですか？", publicYes: "はい、必要な時にもう一度確認してください。", publicNo: "いいえ、今回の記録は研究の範囲で終えてください。" },
  "zh-Hans": { title: "请直接选择这份记录的使用范围。", help: "每项选择只适用于对应目的，且没有预先选中的选项。", researchQ: "是否可以在去除姓名和联系方式后，将此回答纳入研究分析？", researchYes: "可以，用于匿名分析没有问题。", researchNo: "不可以，请不要纳入研究分析。", quoteQ: "是否可以在不署名的情况下，在研究资料中引用你所写的一部分？", quoteYes: "可以，可以不署名引用部分文字。", quoteNo: "不可以，请不要引用个别句子。", publicQ: "如果将来有机会在展览、出版物或网页中介绍这份记录，届时可以再次联系你吗？", publicYes: "可以，需要时请再次确认。", publicNo: "不可以，请将这份记录止于研究范围内。" },
  "zh-Hant": { title: "請直接選擇這份記錄的使用範圍。", help: "每項選擇只適用於對應目的，且沒有預先選中的選項。", researchQ: "是否可以在去除姓名和聯絡方式後，將此回答納入研究分析？", researchYes: "可以，用於匿名分析沒有問題。", researchNo: "不可以，請不要納入研究分析。", quoteQ: "是否可以在不署名的情況下，在研究資料中引用你所寫的一部分？", quoteYes: "可以，可以不署名引用部分文字。", quoteNo: "不可以，請不要引用個別句子。", publicQ: "如果將來有機會在展覽、出版品或網頁中介紹這份記錄，屆時可以再次聯絡你嗎？", publicYes: "可以，需要時請再次確認。", publicNo: "不可以，請將這份記錄止於研究範圍內。" },
  fr: { title: "Choisissez directement le cadre d’utilisation de ce récit.", help: "Chaque choix ne s’applique qu’à son propre objectif. Rien n’est sélectionné à l’avance.", researchQ: "Ce récit peut-il être inclus dans une analyse de recherche sans votre nom ni vos coordonnées ?", researchYes: "Oui, il peut être utilisé dans une analyse anonyme.", researchNo: "Non, ne l’incluez pas dans l’analyse de recherche.", quoteQ: "Une partie de vos phrases peut-elle être citée sans votre nom dans un document de recherche ?", quoteYes: "Oui, certaines phrases peuvent être citées sans mon nom.", quoteNo: "Non, ne citez pas de phrases individuelles.", publicQ: "Si une occasion se présente de présenter ce récit dans une exposition, une publication ou sur le web, pouvons-nous vous recontacter à ce moment-là ?", publicYes: "Oui, veuillez me le demander à nouveau lorsque cela sera nécessaire.", publicNo: "Non, veuillez terminer ce récit dans le cadre de la recherche." },
  es: { title: "Elija directamente el alcance de uso de este registro.", help: "Cada elección se aplica solo a su propio propósito. No hay nada seleccionado de antemano.", researchQ: "¿Puede incluirse esta respuesta en análisis de investigación sin su nombre ni datos de contacto?", researchYes: "Sí, puede usarse en análisis anónimo.", researchNo: "No, no la incluya en análisis de investigación.", quoteQ: "¿Puede citarse parte de lo que escribió sin su nombre en material de investigación?", quoteYes: "Sí, pueden citarse partes sin mi nombre.", quoteNo: "No, no cite frases individuales.", publicQ: "Si en el futuro surge una oportunidad de presentar este registro en una exposición, publicación o en la web, ¿podemos contactarle de nuevo entonces?", publicYes: "Sí, vuelva a consultarme cuando sea necesario.", publicNo: "No, termine este registro dentro del alcance de investigación." },
  nl: { title: "Kies rechtstreeks de gebruiksreikwijdte van dit verslag.", help: "Elke keuze geldt alleen voor het eigen doel. Niets is vooraf geselecteerd.", researchQ: "Mag deze reactie zonder uw naam en contactgegevens worden opgenomen in onderzoekanalyse?", researchYes: "Ja, deze mag in anonieme analyse worden gebruikt.", researchNo: "Nee, neem deze niet op in onderzoekanalyse.", quoteQ: "Mag een deel van wat u schreef zonder uw naam in onderzoeksmateriaal worden geciteerd?", quoteYes: "Ja, delen mogen zonder mijn naam worden geciteerd.", quoteNo: "Nee, citeer geen afzonderlijke zinnen.", publicQ: "Als er later een gelegenheid is om dit verslag in een tentoonstelling, publicatie of op het web te introduceren, mogen we dan opnieuw contact opnemen?", publicYes: "Ja, vraag het opnieuw wanneer dat nodig is.", publicNo: "Nee, rond dit verslag af binnen de onderzoeksreikwijdte." },
  ms: { title: "Sila pilih sendiri skop penggunaan rekod ini.", help: "Setiap pilihan hanya digunakan untuk tujuan masing-masing. Tiada pilihan dipilih lebih awal.", researchQ: "Bolehkah respons ini dimasukkan dalam analisis penyelidikan tanpa nama dan maklumat hubungan anda?", researchYes: "Ya, ia boleh digunakan dalam analisis tanpa nama.", researchNo: "Tidak, jangan masukkannya dalam analisis penyelidikan.", quoteQ: "Bolehkah sebahagian ayat yang anda tinggalkan dipetik tanpa nama dalam bahan penyelidikan?", quoteYes: "Ya, sebahagian ayat boleh dipetik tanpa nama saya.", quoteNo: "Tidak, jangan petik ayat individu.", publicQ: "Jika ada peluang pada masa depan untuk memperkenalkan rekod ini dalam pameran, penerbitan atau web, bolehkah kami menghubungi anda semula ketika itu?", publicYes: "Ya, sila tanya semula apabila diperlukan.", publicNo: "Tidak, tamatkan rekod ini dalam skop penyelidikan." },
};

export function stage1ConsentCopy(language = "ko") {
  return consent[language] || consent.en;
}

// Small interface states added in the Stage 1 completion/referral flow stay
// separate so each of the nine supported UI languages remains explicit.
const uiExtra = {
  ko: { emailAddress: "이메일 주소", required: "필수", optionalMessage: "함께 나누고 싶은 한 문장", messagePlaceholder: "함께 나누고 싶은 한 문장을 적어주세요.", showReferrer: "안내 메일에 추천자 표기 ‘{name}’를 함께 전합니다.", referralConsent: "입력한 이메일을 프로젝트 참여 안내에 사용하는 내용을 확인했어요.", referralStored: "추천 안내를 맡겼어요. 같은 요청은 한 번만 저장됩니다.", referralQueued: "추천 안내 정보는 현재 이 기기에 보관합니다. 실제 이메일 발송은 서버 연결 뒤 시작합니다.", referralSaving: "추천 안내 요청을 저장하고 있어요.", referralDone: "추천 안내를 맡겼어요 ✓", backToRecord: "참여 기록으로 돌아가기", savingTitle: "참여 기록을 저장하고 있어요.", savingLead: "저장이 확인된 뒤 참여 기록과 안부의 다음 흐름으로 이어집니다.", saveFailedTitle: "참여 기록을 아직 저장하지 못했습니다.", saveFailedLead: "작성한 내용은 이 기기에 남아 있습니다. 저장이 확인되기 전에는 완료 화면으로 넘어가지 않습니다.", backToResponses: "응답으로 돌아가기", retrySave: "저장 다시 확인", saveFailedNoStorage: "이 브라우저가 저장을 막고 있어, 작성하신 내용을 이 기기에 남겨두지 못했습니다. 이 화면을 닫지 마시고 「저장 다시 확인」을 눌러 주세요." },
  en: { emailAddress: "Email addresses", required: "Required", optionalMessage: "One sentence to share", messagePlaceholder: "Write one short sentence you would like to share.", showReferrer: "Include the recommender label ‘{name}’ in the invitation email.", referralConsent: "I understand that these addresses are used to send the project invitation.", referralStored: "The invitation request has been entrusted. The same request is stored only once.", referralQueued: "The invitation details are kept on this device. Email delivery begins when the server connection is available.", referralSaving: "Saving the invitation request.", referralDone: "Invitation request entrusted ✓", backToRecord: "Back to participation record", savingTitle: "Saving your participation record.", savingLead: "Once saving is confirmed, we will continue to your record and the next greeting step.", saveFailedTitle: "Your participation record has not been saved yet.", saveFailedLead: "What you wrote remains on this device. We will not move to completion until saving is confirmed.", backToResponses: "Back to responses", retrySave: "Check saving again", saveFailedNoStorage: "This browser is blocking storage, so we could not keep your writing on this device. Please do not close this screen — press “Check saving again”." },
  ja: { emailAddress: "メールアドレス", required: "必須", optionalMessage: "一緒に伝えたい一文", messagePlaceholder: "一緒に伝えたい短い一文を書いてください。", showReferrer: "案内メールに推薦者表記「{name}」を添えます。", referralConsent: "入力したメールアドレスをプロジェクト参加案内に使うことを確認しました。", referralStored: "案内の依頼を託しました。同じ依頼は一度だけ保存されます。", referralQueued: "案内情報はこの端末に保管されています。実際のメール送信はサーバー接続後に始まります。", referralSaving: "案内の依頼を保存しています。", referralDone: "案内の依頼を託しました ✓", backToRecord: "参加記録に戻る", savingTitle: "参加記録を保存しています。", savingLead: "保存を確認してから、参加記録と次のあいさつの流れへ進みます。", saveFailedTitle: "参加記録はまだ保存されていません。", saveFailedLead: "書いた内容はこの端末に残っています。保存を確認するまで完了画面には進みません。", backToResponses: "回答に戻る", retrySave: "保存をもう一度確認", saveFailedNoStorage: "このブラウザが保存をブロックしているため、書いた内容をこの端末に残せませんでした。この画面を閉じずに「保存をもう一度確認」を押してください。" },
  "zh-Hans": { emailAddress: "电子邮箱地址", required: "必填", optionalMessage: "想一起分享的一句话", messagePlaceholder: "请写下一句想分享的话。", showReferrer: "在邀请邮件中附上推荐人标记“{name}”。", referralConsent: "我已了解这些邮箱会用于发送项目参与邀请。", referralStored: "邀请请求已托付。同一请求只会保存一次。", referralQueued: "邀请信息保存在此设备上。服务器连接后才会开始实际邮件发送。", referralSaving: "正在保存邀请请求。", referralDone: "邀请请求已托付 ✓", backToRecord: "返回参与记录", savingTitle: "正在保存你的参与记录。", savingLead: "确认保存后，我们会继续到你的记录与下一步问候。", saveFailedTitle: "你的参与记录尚未保存。", saveFailedLead: "你写下的内容仍保留在此设备上。确认保存前不会进入完成页面。", backToResponses: "返回回答", retrySave: "再次确认保存", saveFailedNoStorage: "此浏览器阻止了存储，我们无法把你写下的内容保留在此设备上。请不要关闭此页面，点击“再次确认保存”。" },
  "zh-Hant": { emailAddress: "電子郵件地址", required: "必填", optionalMessage: "想一起分享的一句話", messagePlaceholder: "請寫下一句想分享的話。", showReferrer: "在邀請郵件中附上推薦人標記「{name}」。", referralConsent: "我已了解這些電子郵件會用於發送專案參與邀請。", referralStored: "邀請請求已託付。同一請求只會儲存一次。", referralQueued: "邀請資訊保存在此裝置上。伺服器連線後才會開始實際郵件發送。", referralSaving: "正在儲存邀請請求。", referralDone: "邀請請求已託付 ✓", backToRecord: "返回參與記錄", savingTitle: "正在儲存你的參與記錄。", savingLead: "確認儲存後，我們會繼續到你的記錄與下一步問候。", saveFailedTitle: "你的參與記錄尚未儲存。", saveFailedLead: "你寫下的內容仍保留在此裝置上。確認儲存前不會進入完成頁面。", backToResponses: "返回回答", retrySave: "再次確認儲存", saveFailedNoStorage: "此瀏覽器阻擋了儲存，我們無法把你寫下的內容保留在此裝置上。請不要關閉此頁面，點擊「再次確認儲存」。" },
  fr: { emailAddress: "Adresses e-mail", required: "Obligatoire", optionalMessage: "Une phrase à partager", messagePlaceholder: "Écrivez une courte phrase que vous souhaitez partager.", showReferrer: "Ajouter la mention de recommandation « {name} » à l’e-mail d’invitation.", referralConsent: "Je comprends que ces adresses servent à envoyer l’invitation au projet.", referralStored: "La demande d’invitation a été confiée. La même demande n’est enregistrée qu’une fois.", referralQueued: "Les informations d’invitation sont conservées sur cet appareil. L’envoi réel commence après la connexion au serveur.", referralSaving: "Enregistrement de la demande d’invitation.", referralDone: "Demande d’invitation confiée ✓", backToRecord: "Retour au dossier de participation", savingTitle: "Enregistrement de votre dossier de participation.", savingLead: "Après confirmation de l’enregistrement, nous continuerons vers votre dossier et l’étape suivante de salutation.", saveFailedTitle: "Votre dossier de participation n’est pas encore enregistré.", saveFailedLead: "Ce que vous avez écrit reste sur cet appareil. Nous ne passerons pas à la fin avant confirmation de l’enregistrement.", backToResponses: "Retour aux réponses", retrySave: "Vérifier à nouveau l’enregistrement", saveFailedNoStorage: "Ce navigateur bloque le stockage : nous n’avons pas pu conserver votre texte sur cet appareil. Ne fermez pas cet écran et appuyez sur « Vérifier à nouveau l’enregistrement »." },
  es: { emailAddress: "Direcciones de correo", required: "Obligatorio", optionalMessage: "Una frase para compartir", messagePlaceholder: "Escriba una frase breve que quiera compartir.", showReferrer: "Incluya la referencia de recomendación “{name}” en el correo de invitación.", referralConsent: "Entiendo que estas direcciones se usan para enviar la invitación al proyecto.", referralStored: "La solicitud de invitación se ha confiado. La misma solicitud se guarda una sola vez.", referralQueued: "Los datos de invitación se guardan en este dispositivo. El envío real comienza al conectar con el servidor.", referralSaving: "Guardando la solicitud de invitación.", referralDone: "Solicitud de invitación confiada ✓", backToRecord: "Volver al registro de participación", savingTitle: "Guardando su registro de participación.", savingLead: "Cuando se confirme el guardado, continuaremos con su registro y el siguiente saludo.", saveFailedTitle: "Su registro de participación todavía no se ha guardado.", saveFailedLead: "Lo que escribió permanece en este dispositivo. No avanzaremos a la finalización hasta confirmar el guardado.", backToResponses: "Volver a respuestas", retrySave: "Comprobar el guardado otra vez", saveFailedNoStorage: "Este navegador bloquea el almacenamiento, así que no pudimos conservar lo que escribió en este dispositivo. No cierre esta pantalla y pulse «Comprobar el guardado otra vez»." },
  nl: { emailAddress: "E-mailadressen", required: "Verplicht", optionalMessage: "Een zin om te delen", messagePlaceholder: "Schrijf één korte zin die u wilt delen.", showReferrer: "Neem de aanbevelingsvermelding ‘{name}’ op in de uitnodigingsmail.", referralConsent: "Ik begrijp dat deze adressen worden gebruikt voor de projectuitnodiging.", referralStored: "Het uitnodigingsverzoek is toevertrouwd. Hetzelfde verzoek wordt slechts één keer opgeslagen.", referralQueued: "De uitnodigingsgegevens staan op dit apparaat. Werkelijke e-mailbezorging begint na een serververbinding.", referralSaving: "Het uitnodigingsverzoek wordt opgeslagen.", referralDone: "Uitnodigingsverzoek toevertrouwd ✓", backToRecord: "Terug naar participatieverslag", savingTitle: "Uw participatieverslag wordt opgeslagen.", savingLead: "Na bevestiging gaan we verder naar uw verslag en de volgende groetstap.", saveFailedTitle: "Uw participatieverslag is nog niet opgeslagen.", saveFailedLead: "Wat u schreef blijft op dit apparaat. We gaan niet naar voltooiing voordat het opslaan is bevestigd.", backToResponses: "Terug naar antwoorden", retrySave: "Opslaan opnieuw controleren", saveFailedNoStorage: "Deze browser blokkeert opslag, dus we konden uw tekst niet op dit apparaat bewaren. Sluit dit scherm niet en druk op “Opslaan opnieuw controleren”." },
  ms: { emailAddress: "Alamat e-mel", required: "Wajib", optionalMessage: "Satu ayat untuk dikongsi", messagePlaceholder: "Tulis satu ayat ringkas yang ingin anda kongsi.", showReferrer: "Sertakan sebutan pencadang “{name}” dalam e-mel jemputan.", referralConsent: "Saya memahami alamat ini digunakan untuk menghantar jemputan projek.", referralStored: "Permintaan jemputan telah diamanahkan. Permintaan yang sama disimpan sekali sahaja.", referralQueued: "Maklumat jemputan disimpan pada peranti ini. Penghantaran e-mel sebenar bermula selepas sambungan pelayan tersedia.", referralSaving: "Menyimpan permintaan jemputan.", referralDone: "Permintaan jemputan telah diamanahkan ✓", backToRecord: "Kembali ke rekod penyertaan", savingTitle: "Menyimpan rekod penyertaan anda.", savingLead: "Selepas simpanan disahkan, kami akan meneruskan ke rekod anda dan langkah salam seterusnya.", saveFailedTitle: "Rekod penyertaan anda belum disimpan.", saveFailedLead: "Apa yang anda tulis kekal pada peranti ini. Kami tidak akan ke halaman selesai sebelum simpanan disahkan.", backToResponses: "Kembali ke jawapan", retrySave: "Semak simpanan sekali lagi", saveFailedNoStorage: "Pelayar ini menyekat storan, jadi kami tidak dapat menyimpan tulisan anda pada peranti ini. Jangan tutup skrin ini dan tekan “Semak simpanan sekali lagi”." },
};

export function stage1UiExtraCopy(language = "ko") {
  return uiExtra[language] || uiExtra.en;
}
