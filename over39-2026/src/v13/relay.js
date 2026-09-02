import { greetingSimplificationCopy } from "./greeting-simplification-i18n.js";

const root = document.querySelector("#relay-root");
const endpoint = String(window.OVER39_SUPABASE_RELAY_URL || "").trim();
const relayQuery = new URLSearchParams(location.search);
const token = relayQuery.get("t") || "";
// 모듈 최상단이다. 쿠키를 막은 사파리에서는 접근만으로 던지고, 그러면 이 파일 전체가
// 실행되지 않아 `#relay-root`가 빈 div로 남는다 — **안부 링크를 열면 완전한 흰 화면.**
// 서버가 만드는 메일함 링크에는 `?lang=`이 붙지 않아 이 줄은 항상 실행된다.
const storedRelayLanguage = () => { try { return localStorage.getItem("over39-interface-language"); } catch { return null; } };
const interfaceLanguage = relayQuery.get("lang") || storedRelayLanguage() || navigator.language || "ko";
const interfaceLanguageCode = String(interfaceLanguage || "").replace(/^zh(?:[-_])?cn$/i, "zh-Hans").replace(/^zh(?:[-_])?(tw|hk)$/i, "zh-Hant");
const text = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

const copy = {
  ko: { label: "〈만 39세 이상〉 · 안부의 좌표", title: "안부의 좌표", lead: "서로 다른 기록 사이에 안부를 남깁니다. 이곳의 위치는 사람의 유형이 아니라 이번 기록에서 읽힌 방향이며, 시간이 지나거나 상황이 달라지면 달라질 수 있습니다. 도착한 원문을 먼저 읽고, 필요하면 번역을 펼쳐보세요.", reason: "이 안부가 닿은 이유", original: "원문", translation: "번역 보기", hideTranslation: "번역 접기", replyTitle: "답장을 맡길까요?", replyHelp: "답장 원문도 그대로 보존하며 연락처는 상대에게 공개하지 않습니다. 이 답장은 다음 사람에게 전할 새로운 안부로 기다릴 수 있습니다.", placeholder: "짧은 인사나 질문을 적어주세요.", pass: "이번에는 지나갈게요", withdraw: "안부 연결 철회", send: "답장 맡기기", sent: "답장을 맡겼습니다.", passed: "이번 안부는 조용히 지나갑니다.", withdrawn: "이 안부 연결을 철회했습니다.", error: "안부를 불러오지 못했습니다. 링크를 다시 확인해주세요.", loading: "안부를 불러오고 있습니다.", mine: "나의 위치", sender: "안부를 보낸 사람의 위치", senderTypes: { MAKING: "작업을 만들어 온 참여자", CONNECTING: "작업과 사람을 이어 온 참여자", READING: "작업을 읽고 기록해 온 참여자", PERFORMANCE: "공연과 연습을 이어 온 참여자", EDUCATION: "교육과 배움을 통해 문화예술을 이어 온 참여자", EVERYDAY: "생활 안에서 문화예술 활동을 이어 온 참여자", CULTURAL_RELATION: "문화예술과 관계를 이어 온 참여자" }, reasonSummary: "이 안부는 두 기록에서 가까이 나타난 방향과 역할, 고른 연결 방향을 함께 읽어 전했습니다. 이 위치는 시간이 지나거나 상황이 달라지면 달라질 수 있습니다.", sameDirection: "두 기록 모두 가까운 한 방향이 남아 있습니다.", adjacentDirection: "두 기록의 방향 가운데 일부가 이웃해 있습니다.", roleBridge: "서로 다른 역할의 자리에서 비슷한 질문이 이어졌습니다." },
  en: { label: "〈Over 39〉 · 안부의 좌표", title: "안부의 좌표", lead: "A greeting is left between different records. The position here is not a person’s fixed type: it is a direction read in this record, and it can change as time or circumstances change. Read the original first, then open the translation if you need it.", reason: "Why this greeting reached you", original: "Original", translation: "View translation", hideTranslation: "Hide translation", replyTitle: "Entrust a reply?", replyHelp: "Your original reply is preserved, and your contact details are never shown to the other participant. This reply may wait as a new greeting for the next person.", placeholder: "A short greeting or question is enough.", pass: "Pass this time", withdraw: "Withdraw this connection", send: "Entrust reply", sent: "Your reply has been entrusted.", passed: "This greeting will pass quietly this time.", withdrawn: "This greeting connection has been withdrawn.", error: "We could not open this greeting. Please check the link.", loading: "Opening the greeting.", mine: "My position", sender: "Sender’s position" },
  ja: { label: "〈39歳以上〉・便りの座標", title: "便りの座標", lead: "異なる記録のあいだに便りを残します。ここでの位置は人の固定的な類型ではなく、今回の記録から読まれた方向です。時間や状況が変われば変わることがあります。まず原文を読み、必要なら翻訳を開いてください。", reason: "この便りが届いた理由", original: "原文", translation: "翻訳を見る", hideTranslation: "翻訳を閉じる", replyTitle: "返事を託しますか？", replyHelp: "返事の原文もそのまま保管され、連絡先が相手に公開されることはありません。この返事は次の人へ届く新しい便りとして待つことがあります。", placeholder: "短い挨拶や質問を書いてください。", pass: "今回は見送る", withdraw: "このつながりを取り消す", send: "返事を託す", sent: "返事を託しました。", passed: "今回はこの便りを静かに見送ります。", withdrawn: "この便りのつながりを取り消しました。", error: "便りを開けませんでした。リンクを確認してください。", loading: "便りを開いています。", mine: "私の位置", sender: "便りを残した人の位置" },
  "zh-Hans": { label: "〈39岁以上〉· 问候坐标", title: "问候坐标", lead: "问候留在不同记录之间。这里的位置不是人的固定类型，而是从这份记录中读出的方向；时间或情况变化后，它也可能变化。请先阅读原文，需要时再展开翻译。", reason: "这封问候抵达的原因", original: "原文", translation: "查看翻译", hideTranslation: "收起翻译", replyTitle: "要托付一封回复吗？", replyHelp: "回复原文会被完整保留，联系方式不会向另一位参与者公开。这封回复可能作为新的问候等待下一位合适的参与者。", placeholder: "写下一句简短问候或问题。", pass: "这次先略过", withdraw: "撤回这次连接", send: "托付回复", sent: "已托付回复。", passed: "这封问候这次会安静地略过。", withdrawn: "已撤回这次问候连接。", error: "无法打开这封问候，请检查链接。", loading: "正在打开问候。", mine: "我的位置", sender: "留下问候者的位置" },
  "zh-Hant": { label: "〈39歲以上〉· 問候座標", title: "問候座標", lead: "問候留在不同記錄之間。這裡的位置不是人的固定類型，而是從這份記錄中讀出的方向；時間或情況改變後，它也可能改變。請先閱讀原文，需要時再展開翻譯。", reason: "這封問候抵達的原因", original: "原文", translation: "查看翻譯", hideTranslation: "收起翻譯", replyTitle: "要託付一封回覆嗎？", replyHelp: "回覆原文會被完整保留，聯絡方式不會向另一位參與者公開。這封回覆可能作為新的問候等待下一位合適的參與者。", placeholder: "寫下一句簡短問候或問題。", pass: "這次先略過", withdraw: "撤回這次連結", send: "託付回覆", sent: "已託付回覆。", passed: "這封問候這次會安靜地略過。", withdrawn: "已撤回這次問候連結。", error: "無法開啟這封問候，請檢查連結。", loading: "正在開啟問候。", mine: "我的位置", sender: "留下問候者的位置" },
  fr: { label: "〈Plus de 39 ans〉 · Coordonnées des salutations", title: "Coordonnées des salutations", lead: "Un message circule entre des récits différents. La position ici n’est pas un type fixe : c’est une direction lue dans ce récit, qui peut changer avec le temps ou les circonstances. Lisez d’abord l’original, puis ouvrez la traduction si besoin.", reason: "Pourquoi ce message vous est parvenu", original: "Original", translation: "Voir la traduction", hideTranslation: "Masquer la traduction", replyTitle: "Confier une réponse ?", replyHelp: "L’original de votre réponse est conservé et vos coordonnées ne sont jamais montrées à l’autre personne. Cette réponse peut attendre comme un nouveau message pour la personne suivante.", placeholder: "Un court bonjour ou une question suffit.", pass: "Passer cette fois", withdraw: "Retirer ce lien", send: "Confier la réponse", sent: "Votre réponse a été confiée.", passed: "Ce message passera discrètement cette fois.", withdrawn: "Ce lien de message a été retiré.", error: "Nous n’avons pas pu ouvrir ce message. Vérifiez le lien.", loading: "Ouverture du message.", mine: "Ma position", sender: "Position de la personne qui a laissé le message" },
  es: { label: "〈Mayores de 39〉 · Coordenadas de saludo", title: "Coordenadas de saludo", lead: "Un saludo queda entre registros distintos. La posición no es un tipo fijo de persona: es una dirección leída en este registro y puede cambiar con el tiempo o las circunstancias. Lea primero el original y abra la traducción si la necesita.", reason: "Por qué le llegó este saludo", original: "Original", translation: "Ver traducción", hideTranslation: "Ocultar traducción", replyTitle: "¿Quiere confiar una respuesta?", replyHelp: "El original de su respuesta se conserva y sus datos de contacto nunca se muestran a la otra persona. Esta respuesta puede esperar como un nuevo saludo para la siguiente persona.", placeholder: "Basta un saludo o una pregunta breve.", pass: "Pasar esta vez", withdraw: "Retirar esta conexión", send: "Confiar respuesta", sent: "Su respuesta ha sido confiada.", passed: "Este saludo pasará tranquilamente esta vez.", withdrawn: "Esta conexión de saludo se ha retirado.", error: "No pudimos abrir este saludo. Revise el enlace.", loading: "Abriendo el saludo.", mine: "Mi posición", sender: "Posición de quien dejó el saludo" },
  nl: { label: "〈39 jaar en ouder〉 · Groetcoördinaten", title: "Groetcoördinaten", lead: "Een groet blijft tussen verschillende records. De positie hier is geen vast type persoon: het is een richting die in dit record wordt gelezen en kan veranderen met tijd of omstandigheden. Lees eerst het origineel en open zo nodig de vertaling.", reason: "Waarom deze groet u bereikte", original: "Origineel", translation: "Vertaling bekijken", hideTranslation: "Vertaling verbergen", replyTitle: "Een antwoord toevertrouwen?", replyHelp: "De originele tekst van uw antwoord blijft bewaard en uw contactgegevens worden nooit aan de andere deelnemer getoond. Dit antwoord kan als nieuwe groet op de volgende persoon wachten.", placeholder: "Een korte groet of vraag is genoeg.", pass: "Deze keer overslaan", withdraw: "Deze verbinding intrekken", send: "Antwoord toevertrouwen", sent: "Uw antwoord is toevertrouwd.", passed: "Deze groet gaat deze keer rustig voorbij.", withdrawn: "Deze groetverbinding is ingetrokken.", error: "We konden deze groet niet openen. Controleer de link.", loading: "De groet wordt geopend.", mine: "Mijn positie", sender: "Positie van de afzender" },
  ms: { label: "〈39 tahun ke atas〉 · Koordinat Salam", title: "Koordinat Salam", lead: "Salam ditinggalkan antara rekod yang berbeza. Kedudukan di sini bukan jenis tetap seseorang: ia ialah arah yang dibaca dalam rekod ini dan boleh berubah mengikut masa atau keadaan. Baca teks asal dahulu, kemudian buka terjemahan jika perlu.", reason: "Mengapa salam ini sampai kepada anda", original: "Teks asal", translation: "Lihat terjemahan", hideTranslation: "Sembunyikan terjemahan", replyTitle: "Amanahkan balasan?", replyHelp: "Teks asal balasan anda disimpan dan maklumat hubungan tidak pernah dipaparkan kepada peserta lain. Balasan ini boleh menunggu sebagai salam baharu untuk orang seterusnya.", placeholder: "Salam atau soalan pendek sudah memadai.", pass: "Lepasi kali ini", withdraw: "Tarik balik hubungan ini", send: "Amanahkan balasan", sent: "Balasan anda telah diamanahkan.", passed: "Salam ini akan berlalu dengan tenang kali ini.", withdrawn: "Hubungan salam ini telah ditarik balik.", error: "Kami tidak dapat membuka salam ini. Sila semak pautan.", loading: "Sedang membuka salam.", mine: "Kedudukan saya", sender: "Kedudukan orang yang meninggalkan salam" },
};

// A received greeting does not travel back to the original sender. A new
// sentence can become a greeting for a later participant, so the public
// language must not imply a direct-reply channel.
const forwardingCopy = {
  ko: { title: "이 안부를 읽고 다음 사람에게 한 문장 남기기", help: "남긴 문장은 원문 그대로 보존하며 연락처는 누구에게도 공개하지 않습니다. 이 문장은 다음 사람에게 이어질 새 안부로 기다립니다.", send: "다음 안부 맡기기", sent: "다음 안부를 맡겼습니다.", notificationTitle: "다음 안부가 도착하면 이메일로 알려드릴까요?", notificationHelp: "이메일은 안부함 링크를 보내는 데만 사용하며, 다른 참여자에게 보이지 않습니다. 새 안부가 도착하면 연구팀이 이 주소로 알림 메일을 보냅니다.", notificationLabel: "알림을 받을 이메일", notificationConsent: "이 이메일을 다음 안부 도착 알림에만 사용해도 괜찮아요.", notificationSave: "알림 요청 저장", notificationStored: "알림 요청을 저장했습니다. 새 안부가 도착하면 연구팀이 알림 메일을 보냅니다." },
  en: { title: "After reading, leave one sentence for the next person", help: "Your original words are preserved and your contact details are never shown. This sentence waits as a new greeting for a later participant.", send: "Entrust the next greeting", sent: "The next greeting has been entrusted.", notificationTitle: "Would you like an email when another greeting arrives?", notificationHelp: "Your email is used only to send a mailbox link and is never shown to another participant. When a new greeting arrives, the research team sends a notification email to this address.", notificationLabel: "Email for notices", notificationConsent: "This email may be used only for notice of a next greeting.", notificationSave: "Save notification request", notificationStored: "Your request is saved. When a new greeting arrives, the research team sends a notification email." },
  ja: { title: "この便りを読み、次の人へ一文を残す", help: "残した文章の原文は保管され、連絡先は誰にも公開されません。この一文は次の人へ続く新しい便りとして待ちます。", send: "次の便りを託す", sent: "次の便りを託しました。", notificationTitle: "次の便りが届いた時にメールで知らせますか？", notificationHelp: "メールは便り箱へのリンクを送るためだけに使い、他の参加者には見せません。 新しい便りが届くと、研究チームがこのアドレスへお知らせメールを送ります。", notificationLabel: "通知を受けるメールアドレス", notificationConsent: "このメールを次の便りの到着通知だけに使ってよいです。", notificationSave: "通知の依頼を保存", notificationStored: "通知のご希望を保存しました。新しい便りが届くと、研究チームがお知らせメールを送ります。" },
  "zh-Hans": { title: "读完后，为下一位参与者留下一句话", help: "你留下的原文会被保留，联系方式不会公开给任何人。这句话会作为新的问候等待下一位参与者。", send: "托付下一封问候", sent: "下一封问候已托付。", notificationTitle: "下一封问候到达时，是否通过邮件通知你？", notificationHelp: "邮箱仅用于发送信箱链接，不会向其他参与者公开。 有新问候到达时，研究团队会向此邮箱发送通知邮件。", notificationLabel: "接收通知的邮箱", notificationConsent: "此邮箱仅可用于下一封问候的到达通知。", notificationSave: "保存通知请求", notificationStored: "已保存通知请求。有新问候到达时，研究团队会发送通知邮件。" },
  "zh-Hant": { title: "讀完後，為下一位參與者留下一句話", help: "你留下的原文會被保留，聯絡方式不會公開給任何人。這句話會作為新的問候等待下一位參與者。", send: "託付下一封問候", sent: "下一封問候已託付。", notificationTitle: "下一封問候到達時，是否透過電子郵件通知你？", notificationHelp: "電子郵件僅用於發送信箱連結，不會向其他參與者公開。 有新問候到達時，研究團隊會向此信箱發送通知郵件。", notificationLabel: "接收通知的電子郵件", notificationConsent: "此電子郵件僅可用於下一封問候的到達通知。", notificationSave: "儲存通知請求", notificationStored: "已儲存通知請求。有新問候到達時，研究團隊會發送通知郵件。" },
  fr: { title: "Après cette lecture, laisser une phrase pour la personne suivante", help: "Votre texte original est conservé et vos coordonnées ne sont montrées à personne. Cette phrase attend comme un nouveau message pour une prochaine personne participante.", send: "Confier le prochain message", sent: "Le prochain message a été confié.", notificationTitle: "Souhaitez-vous un e-mail lorsqu’un autre message arrive ?", notificationHelp: "Votre e-mail sert seulement à envoyer un lien vers la boîte et n’est jamais montré à une autre personne participante. Lorsqu’un nouveau message arrive, l’équipe de recherche envoie un e-mail de notification à cette adresse.", notificationLabel: "E-mail pour les notifications", notificationConsent: "Cet e-mail peut être utilisé seulement pour l’arrivée d’un prochain message.", notificationSave: "Enregistrer la demande", notificationStored: "Votre demande est enregistrée. Lorsqu’un nouveau message arrivera, l’équipe de recherche enverra un e-mail." },
  es: { title: "Después de leerlo, deje una frase para la siguiente persona", help: "Su texto original se conserva y sus datos de contacto no se muestran a nadie. Esta frase espera como un nuevo saludo para otra persona participante.", send: "Confiar el siguiente saludo", sent: "El siguiente saludo ha sido confiado.", notificationTitle: "¿Quiere recibir un correo cuando llegue otro saludo?", notificationHelp: "Su correo se usa solo para enviar un enlace al buzón y nunca se muestra a otra persona participante. Cuando llegue un nuevo saludo, el equipo de investigación enviará un correo de aviso a esta dirección.", notificationLabel: "Correo para avisos", notificationConsent: "Este correo puede usarse solo para avisar de un próximo saludo.", notificationSave: "Guardar solicitud de aviso", notificationStored: "Su solicitud quedó guardada. Cuando llegue un nuevo saludo, el equipo enviará un correo de aviso." },
  nl: { title: "Laat na het lezen één zin achter voor de volgende persoon", help: "Uw oorspronkelijke tekst blijft bewaard en uw contactgegevens worden aan niemand getoond. Deze zin wacht als nieuwe groet voor een volgende deelnemer.", send: "De volgende groet toevertrouwen", sent: "De volgende groet is toevertrouwd.", notificationTitle: "Wilt u een e-mail wanneer een volgende groet aankomt?", notificationHelp: "Uw e-mailadres wordt alleen gebruikt om een mailboxlink te sturen en wordt nooit aan een andere deelnemer getoond. Wanneer een nieuwe groet aankomt, stuurt het onderzoeksteam een melding naar dit adres.", notificationLabel: "E-mail voor meldingen", notificationConsent: "Dit e-mailadres mag alleen worden gebruikt voor een volgende groetmelding.", notificationSave: "Meldingsverzoek opslaan", notificationStored: "Uw verzoek is opgeslagen. Wanneer een nieuwe groet aankomt, stuurt het onderzoeksteam een e-mail." },
  ms: { title: "Selepas membacanya, tinggalkan satu ayat untuk orang seterusnya", help: "Teks asal anda disimpan dan maklumat hubungan tidak dipaparkan kepada sesiapa. Ayat ini menunggu sebagai salam baharu untuk peserta seterusnya.", send: "Amanahkan salam seterusnya", sent: "Salam seterusnya telah diamanahkan.", notificationTitle: "Mahukah anda menerima e-mel apabila salam seterusnya tiba?", notificationHelp: "E-mel anda hanya digunakan untuk menghantar pautan peti surat dan tidak pernah dipaparkan kepada peserta lain. Apabila salam baharu tiba, pasukan penyelidik akan menghantar e-mel makluman ke alamat ini.", notificationLabel: "E-mel untuk notis", notificationConsent: "E-mel ini boleh digunakan hanya untuk notis salam seterusnya.", notificationSave: "Simpan permintaan notis", notificationStored: "Permintaan anda disimpan. Apabila salam baharu tiba, pasukan penyelidik akan menghantar e-mel makluman." },
};

const receiptCopy = {
  ko: { senderContext: "이 안부를 남긴 사람", finishHere: "여기에서 마치기" },
  en: { senderContext: "The person who left this greeting", finishHere: "Finish here" },
  ja: { senderContext: "このあいさつを残した人", finishHere: "ここで終える" },
  "zh-Hans": { senderContext: "留下这则问候的人", finishHere: "在这里结束" },
  "zh-Hant": { senderContext: "留下這則問候的人", finishHere: "在這裡結束" },
  fr: { senderContext: "La personne qui a laissé cette salutation", finishHere: "Terminer ici" },
  es: { senderContext: "La persona que dejó este saludo", finishHere: "Terminar aquí" },
  nl: { senderContext: "De persoon die deze groet achterliet", finishHere: "Hier afronden" },
  ms: { senderContext: "Orang yang meninggalkan salam ini", finishHere: "Tamat di sini" },
};

const task10a4ReceiptCopy = {
  ko: { receivedTitle: "안부 한 통이 도착했습니다.", receivedHelp: "먼저 이곳을 지나간 한 사람이 남긴 문장입니다. 천천히 읽어보세요.", receivedHelpSeed: "프로젝트가 준비한 첫 안부입니다. 천천히 읽어보세요.", receivedHelpResearcher: "연구팀이 확인해 전달한 문장입니다. 천천히 읽어보세요.", reasonSummary: "두 기록에 함께 남은 현재의 흐름과 관계의 단서를 바탕으로 이어진 안부입니다. 이번 기록에서 읽힌 맥락이라 시간이 지나면 달라질 수 있습니다." },
  en: { receivedTitle: "A greeting has arrived.", receivedHelp: "This sentence was left by someone who passed through here before you. Take your time reading it.", receivedHelpSeed: "This is the first greeting prepared by the project. Read it slowly.", receivedHelpResearcher: "This sentence was checked and passed on by the research team. Read it slowly.", reasonSummary: "This greeting was connected through clues about the present flow and relationships that remained in both records. It is context read in these records and may change over time." },
  ja: { receivedTitle: "あいさつが一通届きました。", receivedHelp: "先にここを通った一人が残した文章です。ゆっくり読んでみてください。", receivedHelpSeed: "プロジェクトが用意した最初の便りです。ゆっくりお読みください。", receivedHelpResearcher: "研究チームが確認して届けた文章です。ゆっくりお読みください。", reasonSummary: "二つの記録にともに残った現在の流れと関係の手がかりをもとにつながったあいさつです。今回の記録から読まれた文脈なので、時間がたてば変わることがあります。" },
  "zh-Hans": { receivedTitle: "一则问候已经抵达。", receivedHelp: "这是先前经过这里的一位参与者留下的句子。请慢慢阅读。", receivedHelpSeed: "这是项目准备的第一封问候。请慢慢读。", receivedHelpResearcher: "这是研究团队确认后转达的句子。请慢慢读。", reasonSummary: "这则问候根据两份记录中共同留下的当下脉络与关系线索相连。这是从本次记录中读到的语境，日后可能发生变化。" },
  "zh-Hant": { receivedTitle: "一則問候已經抵達。", receivedHelp: "這是先前經過這裡的一位參與者留下的句子。請慢慢閱讀。", receivedHelpSeed: "這是專案準備的第一封問候。請慢慢讀。", receivedHelpResearcher: "這是研究團隊確認後轉達的句子。請慢慢讀。", reasonSummary: "這則問候根據兩份記錄中共同留下的當下脈絡與關係線索相連。這是從本次記錄中讀到的脈絡，日後可能發生變化。" },
  fr: { receivedTitle: "Une salutation est arrivée.", receivedHelp: "Cette phrase a été laissée par une personne passée ici avant vous. Prenez le temps de la lire.", receivedHelpSeed: "C’est le premier message préparé par le projet. Lisez-le lentement.", receivedHelpResearcher: "Cette phrase a été vérifiée et transmise par l’équipe de recherche. Lisez-la lentement.", reasonSummary: "Cette salutation relie des indices du mouvement présent et des relations restés dans les deux récits. Ce contexte est lu dans ces récits et peut changer avec le temps." },
  es: { receivedTitle: "Ha llegado un saludo.", receivedHelp: "Esta frase la dejó una persona que pasó por aquí antes. Léala con calma.", receivedHelpSeed: "Este es el primer saludo preparado por el proyecto. Léalo con calma.", receivedHelpResearcher: "Esta frase fue revisada y transmitida por el equipo de investigación. Léala con calma.", reasonSummary: "Este saludo se conectó a partir de pistas del curso actual y de las relaciones presentes en ambos registros. Es un contexto leído en estos registros y puede cambiar con el tiempo." },
  nl: { receivedTitle: "Er is een groet aangekomen.", receivedHelp: "Deze zin is achtergelaten door iemand die hier eerder langskwam. Neem de tijd om hem te lezen.", receivedHelpSeed: "Dit is de eerste groet die het project heeft voorbereid. Lees hem rustig.", receivedHelpResearcher: "Deze zin is gecontroleerd en doorgegeven door het onderzoeksteam. Lees hem rustig.", reasonSummary: "Deze groet is verbonden via aanwijzingen over de huidige beweging en relaties die in beide records staan. Deze context is in de records gelezen en kan met de tijd veranderen." },
  ms: { receivedTitle: "Satu salam telah tiba.", receivedHelp: "Ayat ini ditinggalkan oleh seseorang yang melalui tempat ini lebih awal. Bacalah dengan perlahan.", receivedHelpSeed: "Ini salam pertama yang disediakan oleh projek. Bacalah perlahan-lahan.", receivedHelpResearcher: "Ayat ini disemak dan disampaikan oleh pasukan penyelidik. Bacalah perlahan-lahan.", reasonSummary: "Salam ini dihubungkan melalui petunjuk tentang aliran semasa dan hubungan yang kekal dalam kedua-dua rekod. Konteks ini dibaca daripada rekod semasa dan boleh berubah mengikut masa." },
};

// Retire the older direct-reply wording at runtime while retaining the
// non-public field names required by the existing relay contract.
for (const [language, nextPerson] of Object.entries(forwardingCopy)) {
  Object.assign(copy[language], {
    replyTitle: nextPerson.title,
    replyHelp: nextPerson.help,
    send: nextPerson.send,
    sent: nextPerson.sent,
  });
}
Object.assign(copy.en, { label: "〈Over 39〉 · Coordinates of Greeting", title: "Coordinates of Greeting" });

const composeCopy = {
  ko: { begin: "이 안부를 읽고 다음 사람에게 한 문장 남기기", visibility: "상대에게 보이는 표기를 골라주세요.", named: "이름 또는 선택한 표기를 보여줘도 괜찮아요", contextual: "역할·지역 정도만 보여주세요", anonymous: "익명으로 남길게요", translation: "다른 언어권의 사람에게 닿을 때 번역을 함께 보여줄까요?", translationYes: "원문과 번역을 함께 보여주세요", translationNo: "원문만 보여주세요", preview: "상대에게 보이는 내용 확인하기", previewTitle: "상대에게 보이는 내용", confirm: "연락처와 설문 전체가 전달되지 않는 것을 확인했고, 이 문장을 다음 사람에게 맡길게요.", back: "문장 다시 보기" },
  en: { begin: "After reading, leave one sentence for the next person", visibility: "Choose how you will appear to the recipient.", named: "Show my name or chosen label", contextual: "Show only my role or region", anonymous: "Leave it anonymously", translation: "If it reaches another language, should a translation appear with it?", translationYes: "Show the original and a translation", translationNo: "Show the original only", preview: "Review what the recipient sees", previewTitle: "What the recipient sees", confirm: "I understand that contact details and the full survey are not shared, and I entrust this sentence to the next person.", back: "Edit the sentence" },
  ja: { begin: "この便りを読み、次の人へ一文を残す", visibility: "相手に見える表記を選んでください。", named: "名前または選んだ表記を見せる", contextual: "役割・地域だけを見せる", anonymous: "匿名で残す", translation: "別の言語の人に届く時、翻訳も一緒に見せますか？", translationYes: "原文と翻訳を一緒に見せる", translationNo: "原文だけを見せる", preview: "相手に見える内容を確認する", previewTitle: "相手に見える内容", confirm: "連絡先と調査全体が渡らないことを確認し、この一文を次の人へ託します。", back: "文章を見直す" },
  "zh-Hans": { begin: "读完后，为下一位参与者留下一句话", visibility: "请选择对方看到的署名方式。", named: "显示姓名或选择的称呼", contextual: "只显示角色或地区", anonymous: "匿名留下", translation: "传到其他语言使用者时，要同时显示翻译吗？", translationYes: "同时显示原文和翻译", translationNo: "只显示原文", preview: "确认对方看到的内容", previewTitle: "对方看到的内容", confirm: "我已确认联系方式和完整问卷不会传递，并将这句话托付给下一位参与者。", back: "重新查看句子" },
  "zh-Hant": { begin: "讀完後，為下一位參與者留下一句話", visibility: "請選擇對方看到的署名方式。", named: "顯示姓名或選擇的稱呼", contextual: "只顯示角色或地區", anonymous: "匿名留下", translation: "傳到其他語言使用者時，要同時顯示翻譯嗎？", translationYes: "同時顯示原文和翻譯", translationNo: "只顯示原文", preview: "確認對方看到的內容", previewTitle: "對方看到的內容", confirm: "我已確認聯絡方式和完整問卷不會傳遞，並將這句話託付給下一位參與者。", back: "重新查看句子" },
  fr: { begin: "Après cette lecture, laisser une phrase pour la personne suivante", visibility: "Choisissez la mention visible par la personne destinataire.", named: "Montrer mon nom ou la mention choisie", contextual: "Montrer seulement mon rôle ou ma région", anonymous: "Laisser ce message anonymement", translation: "S’il arrive dans une autre langue, afficher aussi une traduction ?", translationYes: "Afficher l’original et la traduction", translationNo: "Afficher seulement l’original", preview: "Vérifier ce que la personne verra", previewTitle: "Ce que la personne verra", confirm: "Je comprends que les coordonnées et le questionnaire complet ne sont pas transmis, et je confie cette phrase à la personne suivante.", back: "Revoir la phrase" },
  es: { begin: "Después de leerlo, deje una frase para la siguiente persona", visibility: "Elija cómo aparecerá ante quien lo reciba.", named: "Mostrar mi nombre o la mención elegida", contextual: "Mostrar solo mi rol o región", anonymous: "Dejarlo de forma anónima", translation: "Si llega a otra lengua, ¿se muestra también una traducción?", translationYes: "Mostrar original y traducción", translationNo: "Mostrar solo el original", preview: "Revisar lo que verá la persona", previewTitle: "Lo que verá la persona", confirm: "Entiendo que no se comparten los datos de contacto ni la encuesta completa, y confío esta frase a la siguiente persona.", back: "Revisar la frase" },
  nl: { begin: "Laat na het lezen één zin achter voor de volgende persoon", visibility: "Kies hoe u voor de ontvanger zichtbaar bent.", named: "Toon mijn naam of gekozen aanduiding", contextual: "Toon alleen mijn rol of regio", anonymous: "Laat het anoniem achter", translation: "Als het een andere taal bereikt, ook een vertaling tonen?", translationYes: "Toon origineel en vertaling", translationNo: "Toon alleen het origineel", preview: "Bekijk wat de ontvanger ziet", previewTitle: "Wat de ontvanger ziet", confirm: "Ik begrijp dat contactgegevens en de volledige enquête niet worden gedeeld en vertrouw deze zin toe aan de volgende persoon.", back: "De zin herzien" },
  ms: { begin: "Selepas membacanya, tinggalkan satu ayat untuk orang seterusnya", visibility: "Pilih bagaimana anda dipaparkan kepada penerima.", named: "Paparkan nama atau label pilihan saya", contextual: "Paparkan peranan atau rantau sahaja", anonymous: "Tinggalkan secara tanpa nama", translation: "Jika sampai kepada bahasa lain, paparkan terjemahan juga?", translationYes: "Paparkan teks asal dan terjemahan", translationNo: "Paparkan teks asal sahaja", preview: "Semak apa yang dilihat penerima", previewTitle: "Apa yang dilihat penerima", confirm: "Saya faham bahawa maklumat hubungan dan keseluruhan soal selidik tidak dikongsi, dan saya mengamanahkan ayat ini kepada orang seterusnya.", back: "Semak semula ayat" },
};

// Structured v3 reason snapshots are deliberately made from category codes,
// not translated respondent text. That lets the same factual explanation be
// shown in the recipient's language while legacy v2 snapshots remain intact.
const greetingReasonCopy = {
  ko: { map: "두 기록에서 읽힌 현재 위치", sender: { MAKING: "작업을 만들어 온 참여자", CONNECTING: "작업과 사람을 이어 온 참여자", READING: "작업을 읽고 기록해 온 참여자", PERFORMANCE: "공연과 연습을 이어 온 참여자", EDUCATION: "교육과 배움을 통해 문화예술을 이어 온 참여자", EVERYDAY: "생활 안에서 문화예술 활동을 이어 온 참여자", CULTURAL_RELATION: "문화예술과 관계를 이어 온 참여자" }, summary: "이 안부는 두 기록에서 가까이 나타난 방향과 역할, 고른 연결 방향을 함께 읽어 전했습니다. 이 위치는 시간이 지나거나 상황이 달라지면 달라질 수 있습니다.", SAME_DIRECTION: "두 기록 모두 가까운 한 방향이 남아 있습니다.", ADJACENT_DIRECTION: "두 기록의 방향 가운데 일부가 이웃해 있습니다.", ROLE_BRIDGE: "서로 다른 역할의 자리에서 비슷한 질문이 이어졌습니다." },
  en: { map: "Current positions read in the two records", sender: { MAKING: "a participant who has been making work", CONNECTING: "a participant who has been connecting work and people", READING: "a participant who has been reading and documenting work", PERFORMANCE: "a participant who has been continuing performance and practice", EDUCATION: "a participant who has been continuing arts and culture through teaching and learning", EVERYDAY: "a participant who has been continuing arts and culture in everyday life", CULTURAL_RELATION: "a participant who has remained in relation with arts and culture" }, summary: "This greeting was passed on by reading the directions that appeared close in both records, the present roles, and the chosen direction of connection. This position can change with time or circumstances.", SAME_DIRECTION: "One nearby direction appears in both records.", ADJACENT_DIRECTION: "Some directions in the two records sit next to one another.", ROLE_BRIDGE: "A similar question continues from different roles." },
  ja: { map: "二つの記録から読まれた現在の位置", sender: { MAKING: "制作を続けてきた参加者", CONNECTING: "作品と人をつないできた参加者", READING: "作品を読み、記録してきた参加者", PERFORMANCE: "公演と練習を続けてきた参加者", EDUCATION: "教育と学びを通して文化芸術を続けてきた参加者", EVERYDAY: "生活の中で文化芸術活動を続けてきた参加者", CULTURAL_RELATION: "文化芸術との関係を続けてきた参加者" }, summary: "この便りは、二つの記録で近くに現れた方向、現在の役割、選ばれたつながりの方向をあわせて読んで届けられました。この位置は時間や状況によって変わることがあります。", SAME_DIRECTION: "二つの記録に近い一つの方向が残っています。", ADJACENT_DIRECTION: "二つの記録の方向の一部が隣り合っています。", ROLE_BRIDGE: "異なる役割の場所から似た問いが続いています。" },
  "zh-Hans": { map: "两份记录中读到的当前位置", sender: { MAKING: "一位持续创作的参与者", CONNECTING: "一位持续连接作品与他人的参与者", READING: "一位持续阅读并记录作品的参与者", PERFORMANCE: "一位持续表演与练习的参与者", EDUCATION: "一位通过教学与学习持续参与文化艺术的参与者", EVERYDAY: "一位在日常生活中持续参与文化艺术的参与者", CULTURAL_RELATION: "一位持续与文化艺术保持关系的参与者" }, summary: "这封问候综合阅读了两份记录中相近的方向、当前角色与所选的连接方向后送达。这个位置会随时间或情况而变化。", SAME_DIRECTION: "两份记录中都出现了一个相近的方向。", ADJACENT_DIRECTION: "两份记录中的部分方向彼此相邻。", ROLE_BRIDGE: "相似的问题从不同角色的位置延续而来。" },
  "zh-Hant": { map: "兩份記錄中讀到的目前位置", sender: { MAKING: "一位持續創作的參與者", CONNECTING: "一位持續連結作品與他人的參與者", READING: "一位持續閱讀並記錄作品的參與者", PERFORMANCE: "一位持續表演與練習的參與者", EDUCATION: "一位透過教學與學習持續參與文化藝術的參與者", EVERYDAY: "一位在日常生活中持續參與文化藝術的參與者", CULTURAL_RELATION: "一位持續與文化藝術保持關係的參與者" }, summary: "這封問候綜合閱讀了兩份記錄中相近的方向、目前角色與所選的連結方向後送達。這個位置會隨時間或情況而改變。", SAME_DIRECTION: "兩份記錄中都出現了一個相近的方向。", ADJACENT_DIRECTION: "兩份記錄中的部分方向彼此相鄰。", ROLE_BRIDGE: "相似的問題從不同角色的位置延續而來。" },
  fr: { map: "Positions actuelles lues dans les deux récits", sender: { MAKING: "une personne participante qui crée", CONNECTING: "une personne participante qui relie les œuvres et les personnes", READING: "une personne participante qui lit et documente des œuvres", PERFORMANCE: "une personne participante qui poursuit la pratique et la scène", EDUCATION: "une personne participante qui poursuit les arts et la culture par l’enseignement et l’apprentissage", EVERYDAY: "une personne participante qui poursuit les arts et la culture dans la vie quotidienne", CULTURAL_RELATION: "une personne participante qui reste en relation avec les arts et la culture" }, summary: "Cette salutation a été transmise en lisant les directions proches dans les deux récits, les rôles actuels et la direction de lien choisie. Cette position peut changer avec le temps ou les circonstances.", SAME_DIRECTION: "Une direction proche apparaît dans les deux récits.", ADJACENT_DIRECTION: "Certaines directions des deux récits sont voisines.", ROLE_BRIDGE: "Une question similaire se poursuit depuis des rôles différents." },
  es: { map: "Posiciones actuales leídas en los dos registros", sender: { MAKING: "una persona participante que ha seguido creando", CONNECTING: "una persona participante que ha conectado obras y personas", READING: "una persona participante que ha leído y documentado obras", PERFORMANCE: "una persona participante que ha seguido actuando y practicando", EDUCATION: "una persona participante que ha continuado en las artes y la cultura mediante enseñanza y aprendizaje", EVERYDAY: "una persona participante que ha continuado en las artes y la cultura en la vida cotidiana", CULTURAL_RELATION: "una persona participante que ha mantenido una relación con las artes y la cultura" }, summary: "Este saludo se entregó al leer las direcciones cercanas en ambos registros, los roles actuales y la dirección de conexión elegida. Esta posición puede cambiar con el tiempo o las circunstancias.", SAME_DIRECTION: "Una dirección cercana aparece en ambos registros.", ADJACENT_DIRECTION: "Algunas direcciones de los dos registros son vecinas.", ROLE_BRIDGE: "Una pregunta similar continúa desde roles diferentes." },
  nl: { map: "Huidige posities uit de twee records", sender: { MAKING: "een deelnemer die werk maakt", CONNECTING: "een deelnemer die werk en mensen verbindt", READING: "een deelnemer die werk leest en documenteert", PERFORMANCE: "een deelnemer die optreden en oefenen voortzet", EDUCATION: "een deelnemer die kunst en cultuur voortzet via onderwijs en leren", EVERYDAY: "een deelnemer die kunst en cultuur in het dagelijks leven voortzet", CULTURAL_RELATION: "een deelnemer die verbonden blijft met kunst en cultuur" }, summary: "Deze groet is doorgegeven door de richtingen die in beide records dichtbij verschijnen, de huidige rollen en de gekozen richting van verbinding samen te lezen. Deze positie kan veranderen met tijd of omstandigheden.", SAME_DIRECTION: "In beide records verschijnt één nabije richting.", ADJACENT_DIRECTION: "Enkele richtingen in de twee records liggen naast elkaar.", ROLE_BRIDGE: "Een vergelijkbare vraag loopt door vanuit verschillende rollen." },
  ms: { map: "Kedudukan semasa yang dibaca dalam dua rekod", sender: { MAKING: "seorang peserta yang terus menghasilkan karya", CONNECTING: "seorang peserta yang menghubungkan karya dan orang", READING: "seorang peserta yang membaca dan mendokumentasikan karya", PERFORMANCE: "seorang peserta yang meneruskan persembahan dan latihan", EDUCATION: "seorang peserta yang meneruskan seni dan budaya melalui pengajaran dan pembelajaran", EVERYDAY: "seorang peserta yang meneruskan seni dan budaya dalam kehidupan harian", CULTURAL_RELATION: "seorang peserta yang terus berhubung dengan seni dan budaya" }, summary: "Salam ini disampaikan dengan membaca bersama arah yang dekat dalam kedua-dua rekod, peranan semasa dan arah hubungan yang dipilih. Kedudukan ini boleh berubah mengikut masa atau keadaan.", SAME_DIRECTION: "Satu arah yang dekat muncul dalam kedua-dua rekod.", ADJACENT_DIRECTION: "Sebahagian arah dalam dua rekod bersebelahan.", ROLE_BRIDGE: "Soalan yang serupa berterusan daripada peranan yang berbeza." },
};

let state = { loading: true, relay: null, error: "", result: "", notification: "", translations: new Set(), composeStep: "read", draft: { message: "", sender_visibility: "", translation_allowed: "", confirmed: false } };
function c() { return copy[interfaceLanguageCode] || copy[String(interfaceLanguageCode).toLowerCase().startsWith("ko") ? "ko" : "en"]; }
function forwarding() { return forwardingCopy[interfaceLanguageCode] || forwardingCopy[String(interfaceLanguageCode).toLowerCase().startsWith("ko") ? "ko" : "en"]; }
function compose() { return composeCopy[interfaceLanguageCode] || composeCopy[String(interfaceLanguageCode).toLowerCase().startsWith("ko") ? "ko" : "en"]; }
function reasonCopy() { return greetingReasonCopy[interfaceLanguageCode] || greetingReasonCopy[String(interfaceLanguageCode).toLowerCase().startsWith("ko") ? "ko" : "en"]; }
function receipt() { return receiptCopy[interfaceLanguageCode] || receiptCopy[String(interfaceLanguageCode).toLowerCase().startsWith("ko") ? "ko" : "en"]; }
function task10a4Receipt() { return task10a4ReceiptCopy[interfaceLanguageCode] || task10a4ReceiptCopy[String(interfaceLanguageCode).toLowerCase().startsWith("ko") ? "ko" : "en"]; }
function simplifiedGreeting() { return greetingSimplificationCopy(interfaceLanguageCode); }
function reasonDetails(thread) {
  const reason = thread.connection_reason;
  if (!reason) return { sender: "", summary: "", evidence: [] };
  const structured = reason.version === "greeting-coordinate-reason-v3" && reason.summary_key === "CURATED_RECORD_CONNECTION";
  const localized = reasonCopy();
  // 익명 검사가 `structured` 분기 안에만 있었다. 그런데 실제 자동 배달 경로는
  // `greeting-random-safe-v1`이라 그 분기를 타지 않고 `reason.sender_context`를 그대로
  // 보여줬다 — 익명으로 남긴 참여자의 역할이 낯선 사람 화면에 나왔다. 어느 판본이든
  // 익명이면 발신자 표시를 비운다.
  // 예전 스냅샷에는 sender_visibility 필드가 아예 없다. 없으면 익명으로 취급한다 —
  // 발신자 표시는 명시적으로 공개를 고른 기록이 있을 때만 한다.
  if (reason.sender_visibility !== "NAMED" && reason.sender_visibility !== "CONTEXTUAL") {
    return { sender: "", summary: task10a4Receipt().reasonSummary, evidence: [] };
  }
  const sender = structured
    ? (reason.sender_visibility === "ANONYMOUS" ? "" : (reason.sender_visibility === "NAMED" && reason.sender_display_label ? reason.sender_display_label : localized.sender[reason.sender_context_code]))
    : reason.sender_context;
  const summary = task10a4Receipt().reasonSummary;
  const evidence = structured
    ? (reason.evidence_codes || []).slice(0, 2).map((item) => localized[item?.type]).filter(Boolean)
    : [];
  return { sender, summary, evidence };
}
function senderContextSection(thread) {
  const { sender } = reasonDetails(thread);
  return sender ? `<section class="relay-sender-context"><span>${text(receipt().senderContext)}</span><strong>${text(sender)}</strong></section>` : "";
}
function messageCard(message) {
  return `<article class="relay-letter"><p lang="${text(message.source_language || "")}">${text(message.body_original)}</p></article>`;
}
function messageLanguage(message) {
  const open = state.translations.has(message.id);
  return `<section class="relay-message-language"><span>${text(c().original)} · ${text(message.source_language || "")}</span>${message.translated_body ? `<button class="translation-toggle" type="button" data-translation-id="${text(message.id)}" aria-expanded="${open}">${text(open ? c().hideTranslation : c().translation)}</button>${open ? `<div class="relay-translation" lang="${text(message.translation_language || "")}"><span>${text(message.translation_language || "")}</span><p>${text(message.translated_body)}</p></div>` : ""}` : ""}</section>`;
}
function render() {
  const simplified = simplifiedGreeting();
  if (state.loading) { root.innerHTML = `<main class="relay-layout"><p>${text(c().loading)}</p></main>`; return; }
  if (state.error) { root.innerHTML = `<main class="relay-layout"><section class="relay-card"><div class="archive-label">${text(simplified.projectLabel)}</div><h1>${text(c().error)}</h1></section></main>`; return; }
  const next = forwarding();
  const notification = `<section class="relay-notification"><h2>${text(next.notificationTitle)}</h2><p>${text(next.notificationHelp)}</p><label>${text(next.notificationLabel)}<input class="text-input text-input-single" type="email" data-relay-notification-email autocomplete="email" /></label><label class="final-check"><input type="checkbox" data-relay-notification-consent /><span>${text(next.notificationConsent)}</span></label><button class="secondary-button" data-relay-action="notification">${text(next.notificationSave)}</button>${state.notification ? `<p role="status">${text(state.notification)}</p>` : ""}</section>`;
  if (state.result) { root.innerHTML = `<main class="relay-layout"><section class="relay-card"><div class="archive-label">${text(simplified.projectLabel)}</div><h1>${text(state.result)}</h1>${notification}</section></main>`; return; }
  const thread = state.relay.thread; const messages = thread.messages || [];
  const draft = state.draft;
  const identityChoices = [["NAMED", compose().named], ["CONTEXTUAL", compose().contextual], ["ANONYMOUS", compose().anonymous]];
  const choiceButtons = (field, options) => `<div class="choice-list">${options.map(([value, label]) => `<button type="button" class="choice ${draft[field] === value ? "selected" : ""}" data-relay-choice="${text(field)}" data-relay-choice-value="${text(value)}" aria-pressed="${draft[field] === value}"><span aria-hidden="true">${draft[field] === value ? "✓" : ""}</span><strong>${text(label)}</strong></button>`).join("")}</div>`;
  const composeFlow = state.composeStep === "read"
    ? `<section class="relay-reply relay-read-actions"><div class="relay-next-prompt"><h2>${text(simplified.continuationTitle)}</h2><p>${text(simplified.continuationHelp)}</p></div><div class="relay-actions relay-next-actions"><button class="primary-button" data-relay-action="begin">${text(simplified.continuationPrimary)} <span aria-hidden="true">→</span></button><button class="secondary-button" data-relay-action="pass">${text(simplified.continuationSecondary)}</button></div><button class="relay-withdraw" data-relay-action="withdraw">${text(c().withdraw)}</button></section>`
    : state.composeStep === "write"
      ? `<section class="relay-reply"><h2>${text(simplified.writingTitle)}</h2><p class="greeting-writing-help">${text(simplified.writingHelp)}</p><textarea class="text-input" data-relay-message maxlength="1400" placeholder="${text(c().placeholder)}">${text(draft.message)}</textarea><aside class="greeting-writing-example" aria-label="${text(simplified.exampleLabel)}"><span>${text(simplified.exampleLabel)}</span><p>${text(simplified.exampleText)}</p></aside><h3>${text(compose().visibility)}</h3>${choiceButtons("sender_visibility", identityChoices)}<h3>${text(compose().translation)}</h3>${choiceButtons("translation_allowed", [["YES", compose().translationYes], ["NO", compose().translationNo]])}<div class="relay-actions"><button class="secondary-button" data-relay-action="back-read">${text(c().original)}</button><button class="primary-button" data-relay-action="preview">${text(compose().preview)} <span aria-hidden="true">→</span></button></div></section>`
      : `<section class="relay-reply relay-preview"><h2>${text(compose().previewTitle)}</h2><article class="relay-letter"><span>${text(c().original)} · ${text(interfaceLanguageCode)}</span><p>${text(draft.message)}</p></article><dl><div><dt>${text(compose().visibility)}</dt><dd>${text(identityChoices.find(([value]) => value === draft.sender_visibility)?.[1] || "")}</dd></div><div><dt>${text(compose().translation)}</dt><dd>${text(draft.translation_allowed === "YES" ? compose().translationYes : compose().translationNo)}</dd></div></dl><label class="final-check"><input type="checkbox" data-relay-preview-confirmed ${draft.confirmed ? "checked" : ""} /><span>${text(compose().confirm)}</span></label><div class="relay-actions"><button class="secondary-button" data-relay-action="back-write">${text(compose().back)}</button><button class="primary-button" data-relay-action="reply" ${draft.confirmed ? "" : "disabled"}>${text(next.send)} <span aria-hidden="true">→</span></button></div></section>`;
  const firstMessage = messages[0] || null;
  const laterMessages = messages.slice(1);
  const receivedGreeting = firstMessage
    ? `<section class="relay-messages relay-received-message">${messageCard(firstMessage)}</section>${senderContextSection(thread)}${messageLanguage(firstMessage)}`
    : "";
  const laterThread = laterMessages.length
    ? `<section class="relay-messages relay-later-messages">${laterMessages.map((message) => `${messageCard(message)}${messageLanguage(message)}`).join("")}</section>`
    : "";
  // 프로젝트 시드와 연구팀 전달문에 「사람이 남긴 문장」 머리말을 달지 않는다 —
  // 발신자 맥락 라벨과 머리말이 서로 모순되지 않게 한다.
  const reasonMeta = thread.connection_reason || {};
  const isSeedGreeting = reasonMeta.sender_context_code === "PROJECT_SEED" || reasonMeta.summary_key === "PROJECT_FIRST_GREETING";
  const receivedHelpText = isSeedGreeting ? simplified.receivedHelpSeed : firstMessage?.sender_kind === "researcher" ? simplified.receivedHelpResearcher : simplified.receivedHelp;
  const receivedHeading = firstMessage
    ? `<h1>${text(simplified.receivedTitle)}</h1><p class="relay-lead">${text(receivedHelpText)}</p>`
    : `<h1>${text(simplified.featureName)}</h1>`;
  root.innerHTML = `<main class="relay-layout"><section class="relay-card ${firstMessage ? "relay-card-received greeting-arrival" : ""}"><div class="archive-label">${text(simplified.projectLabel)}</div>${receivedHeading}${receivedGreeting}${laterThread}${thread.can_reply ? composeFlow : ""}</section></main>`;
}
async function request(payload) {
  if (!endpoint || !token) throw new Error("RELAY_NOT_CONFIGURED");
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, token }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) throw new Error(body.error_code || "RELAY_REQUEST_FAILED");
  return body;
}

document.addEventListener("click", async (event) => {
  const translation = event.target.closest("[data-translation-id]");
  if (translation) { const id = translation.dataset.translationId; state.translations.has(id) ? state.translations.delete(id) : state.translations.add(id); render(); return; }
  const choice = event.target.closest("[data-relay-choice]");
  if (choice) { state.draft[choice.dataset.relayChoice] = choice.dataset.relayChoiceValue; state.draft.confirmed = false; render(); return; }
  const button = event.target.closest("[data-relay-action]"); if (!button) return;
  try {
    const action = button.dataset.relayAction;
    if (action === "notification") {
      const email = document.querySelector("[data-relay-notification-email]")?.value.trim() || "";
      const consent = document.querySelector("[data-relay-notification-consent]")?.checked === true;
      if (!email || !consent) return;
      await request({ action: "set_notification", email, consent: true });
      state.notification = forwarding().notificationStored;
      render();
      return;
    }
    if (action === "begin") { state.composeStep = "write"; render(); return; }
    if (action === "back-read") { state.composeStep = "read"; render(); return; }
    if (action === "back-write") { state.composeStep = "write"; state.draft.confirmed = false; render(); return; }
    if (action === "preview") {
      if (!state.draft.message.trim() || !state.draft.sender_visibility || !state.draft.translation_allowed) return;
      state.composeStep = "preview";
      render();
      return;
    }
    if (action === "pass") { await request({ action: "respond", intent: "pass" }); state.result = c().passed; }
    else if (action === "withdraw") { await request({ action: "respond", intent: "withdraw" }); state.result = c().withdrawn; }
    else if (action === "reply") {
      if (!state.draft.message.trim() || !state.draft.sender_visibility || !state.draft.translation_allowed || !state.draft.confirmed) return;
      await request({ action: "respond", intent: "reply", message: state.draft.message.trim(), source_language: interfaceLanguageCode, sender_visibility: state.draft.sender_visibility, translation_allowed: state.draft.translation_allowed === "YES" });
      state.result = forwarding().sent;
    }
  } catch { state.error = "RELAY_REQUEST_FAILED"; }
  render();
});

document.addEventListener("input", (event) => {
  if (!event.target.matches("[data-relay-message]")) return;
  state.draft.message = event.target.value;
  state.draft.confirmed = false;
});

document.addEventListener("change", (event) => {
  if (!event.target.matches("[data-relay-preview-confirmed]")) return;
  state.draft.confirmed = event.target.checked;
  const button = document.querySelector("[data-relay-action='reply']");
  if (button) button.disabled = !state.draft.confirmed;
});

if (!token || !endpoint) { state.loading = false; state.error = "RELAY_NOT_CONFIGURED"; render(); }
else request({ action: "view" }).then((relay) => { state.relay = relay; state.loading = false; render(); }).catch(() => { state.loading = false; state.error = "RELAY_ACCESS_DENIED"; render(); });
