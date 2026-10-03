import { greetingSimplificationCopy } from "./greeting-simplification-i18n.js?v=v7-20261003-r105";
import { applyFrenchSpacing } from "./french-typography.js?v=v7-20261003-r105";
import { greetingTranslationNeeded, translateArrivedGreeting } from "./depth.js?v=v7-20261003-r105";
import { GREETING_LONG_CHARS, greetingParagraphsOf, languageLabel, narrowLanguage } from "./greeting-text.js?v=v7-20261003-r105";
import { withHongKong } from "./hong-kong.js?v=v7-20261003-r105";

const root = document.querySelector("#relay-root");
const endpoint = String(window.OVER39_SUPABASE_RELAY_URL || "").trim();
const relayQuery = new URLSearchParams(location.search);
// 열쇠는 주소의 # 뒤에 온다(2026-09-14). 그 앞에 ?t= 로 나간 링크가 이미 있을 수
// 있으므로 둘 다 받는다 — 참여자가 옛 메일을 열었을 때 닫히면 안 된다.
const hashToken = location.hash.startsWith("#") ? decodeURIComponent(location.hash.slice(1)) : "";
const token = hashToken || relayQuery.get("t") || "";
// 모듈 최상단이다. 쿠키를 막은 사파리에서는 접근만으로 던지고, 그러면 이 파일 전체가
// 실행되지 않아 `#relay-root`가 빈 div로 남는다 — **안부 링크를 열면 완전한 흰 화면.**
// 서버가 만드는 메일함 링크에는 `?lang=`이 붙지 않아 이 줄은 항상 실행된다.
const storedRelayLanguage = () => { try { return localStorage.getItem("over39-interface-language"); } catch { return null; } };
// 주소로 지정한 것 > 지난번에 고른 것 > 브라우저가 알려주는 것 > 한국어. 어느 쪽이든 아홉 개
// 중 하나로 좁힌다 — 좁히지 않으면 「ko-KR」이 그대로 번역 목적 언어와 사전 열쇠가 된다.
const interfaceLanguageCode = [relayQuery.get("lang"), storedRelayLanguage(), ...(Array.isArray(navigator?.languages) ? navigator.languages : [navigator?.language])]
  .map(narrowLanguage).find(Boolean) || "ko";
// 이 페이지의 html 은 늘 lang="ko" 였다. 일본어·중국어로 보여도 한국어로 적혀 있어서, 말마다
// 다르게 줄을 바꾸는 규칙(:lang)이 듣지 않았고 화면 낭독기는 일본어를 한국어로 읽었다.
document.documentElement.lang = interfaceLanguageCode || "ko";
// 탭 제목도 그 말로(2026-10-02 휴대폰 통과). 모든 언어에서 한국어 옛 이름 「안부의 좌표」가 떠 있었다 —
// 화면 맨 위 이름표와 같은 말을 쓴다.
document.title = greetingSimplificationCopy(interfaceLanguageCode).projectLabel || document.title;
const text = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

const copy = {
  ko: { label: "〈만 39세 이상〉 · 안부의 좌표", title: "안부의 좌표", lead: "서로 다른 기록 사이에 안부를 남깁니다. 이곳의 위치는 사람의 유형이 아니라 이번 기록에서 읽힌 방향이며, 시간이 지나거나 상황이 달라지면 달라질 수 있습니다. 도착한 원문을 먼저 읽고, 필요하면 번역을 펼쳐보세요.", reason: "이 안부가 닿은 이유", original: "원문", translation: "번역 보기", hideTranslation: "번역 접기", replyTitle: "답장을 맡길까요?", replyHelp: "답장 원문도 그대로 보존하며 연락처는 상대에게 공개하지 않습니다. 이 답장은 다음 사람에게 전할 새로운 안부로 기다릴 수 있습니다.", placeholder: "짧은 인사나 질문을 적어주세요.", pass: "이번에는 지나갈게요", withdraw: "안부 연결 철회", send: "답장 맡기기", sent: "답장을 맡겼습니다.", passed: "이번 안부는 조용히 지나갑니다.", withdrawn: "이 안부 연결을 철회했습니다.", error: "안부를 불러오지 못했습니다. 링크를 다시 확인해주세요.", loading: "안부를 불러오고 있습니다.", mine: "나의 위치", sender: "안부를 보낸 사람의 위치", senderTypes: { MAKING: "작업을 만들어 온 참여자", CONNECTING: "작업과 사람을 이어 온 참여자", READING: "작업을 읽고 기록해 온 참여자", PERFORMANCE: "공연과 연습을 이어 온 참여자", EDUCATION: "교육과 배움을 통해 문화예술을 이어 온 참여자", EVERYDAY: "생활 안에서 문화예술 활동을 이어 온 참여자", CULTURAL_RELATION: "문화예술과 관계를 이어 온 참여자" }, reasonSummary: "이 안부는 두 기록에서 가까이 나타난 방향과 역할, 고른 연결 방향을 함께 읽어 전했습니다. 이 위치는 시간이 지나거나 상황이 달라지면 달라질 수 있습니다.", sameDirection: "두 기록 모두 가까운 한 방향이 남아 있습니다.", adjacentDirection: "두 기록의 방향 가운데 일부가 이웃해 있습니다.", roleBridge: "서로 다른 역할의 자리에서 비슷한 질문이 이어졌습니다." },
  en: { label: "〈Over 39〉 · 안부의 좌표", title: "안부의 좌표", lead: "Greetings are left between different records. The positions here are not types of people but directions read in this record, and they can change as time passes or circumstances change. First read the original that has arrived, then open the translation if you need it.", reason: "Why this greeting reached you", original: "Original", translation: "View translation", hideTranslation: "Hide translation", replyTitle: "Would you like to leave a reply?", replyHelp: "Your reply is also kept exactly as you write it, and your contact details are not shown to the other person. This reply may wait as a new greeting to pass on to the next person.", placeholder: "Write a short hello or a question.", pass: "I’ll pass this time", withdraw: "Withdraw greeting connection", send: "Leave my reply", sent: "Your reply is in our care.", passed: "This greeting will pass by quietly.", withdrawn: "This greeting connection has been withdrawn.", error: "We couldn’t open this greeting. Please check the link again.", loading: "Opening the greeting…", mine: "My position", sender: "Sender’s position" },
  ja: { label: "〈39歳以上〉・あいさつの座標", title: "あいさつの座標", lead: "異なる記録のあいだに、あいさつを残します。ここでの位置は人のタイプではなく、今回の記録から読み取った方向で、時間や状況が変われば変わることもあります。届いた原文をまず読み、必要なら翻訳を開いてください。", reason: "このあいさつが届いた理由", original: "原文", translation: "翻訳を見る", hideTranslation: "翻訳を閉じる", replyTitle: "返事を託しますか？", replyHelp: "返事の原文もそのまま保管され、連絡先が相手に公開されることはありません。この返事は新しいあいさつとして、次の人に届くのを待つことがあります。", placeholder: "短いあいさつや質問を書いてください。", pass: "今回は見送る", withdraw: "あいさつのつながりを撤回する", send: "返事を託す", sent: "返事を託しました。", passed: "今回はこのあいさつを静かに見送ります。", withdrawn: "このあいさつのつながりを撤回しました。", error: "あいさつを読み込めませんでした。リンクをもう一度確認してください。", loading: "あいさつを読み込んでいます。", mine: "自分の位置", sender: "あいさつを残した人の位置" },
  "zh-Hans": { label: "〈39岁以上〉· 问候坐标", title: "问候坐标", lead: "在不同的记录之间留下问候。这里的位置不是给人分的类型，而是从这次记录中读出的方向；随着时间推移或情况变化，它也可能改变。请先读到达的原文，需要时再展开译文。", reason: "这封问候为何来到您这里", original: "原文", translation: "查看译文", hideTranslation: "收起译文", replyTitle: "要寄一封回信吗？", replyHelp: "回信的原文也会原样保存，您的联系方式不会向对方公开。这封回信可能会作为一封新的问候，等待送给下一位。", placeholder: "写下一句简短的招呼或问题。", pass: "这次就略过", withdraw: "撤回问候配对", send: "寄出回信", sent: "回信已寄出。", passed: "这封问候，这次就静静地略过。", withdrawn: "已撤回这封问候的配对。", error: "没能打开这封问候，请再检查一下链接。", loading: "正在打开问候。", mine: "我的位置", sender: "寄信人的位置" },
  "zh-Hant": { label: "〈39歲以上〉· 問候的座標", title: "問候的座標", lead: "在不同的記錄之間留下問候。這裡的位置不是人的類型，而是從這次記錄中讀出的方向；隨著時間過去或情況改變，它也可能不同。請先讀寄來的原文，需要時再展開譯文。", reason: "這則問候送到您這裡的原因", original: "原文", translation: "查看翻譯", hideTranslation: "收起翻譯", replyTitle: "要託付一封回信嗎？", replyHelp: "回信的原文也會完整保留，聯絡方式不會讓對方看到。這封回信可能會成為一則新的問候，等著傳給下一位。", placeholder: "寫下簡短的問候或提問。", pass: "這次先略過", withdraw: "撤回問候連結", send: "託付回信", sent: "回信已託付。", passed: "這則問候，這次就靜靜地略過了。", withdrawn: "已撤回這次問候連結。", error: "無法載入問候，請再確認一下連結。", loading: "正在載入問候。", mine: "我的位置", sender: "寄信人的位置" },
  fr: { label: "〈39 ans et plus〉 · La carte des messages", title: "La carte des messages", lead: "Un message circule entre des récits différents. Ici, la position n’est pas un type de personne : c’est une direction lue dans ce récit, qui peut changer avec le temps ou les circonstances. Lisez d’abord le texte original reçu, puis ouvrez la traduction si besoin.", reason: "Pourquoi ce message vous est parvenu", original: "Texte original", translation: "Voir la traduction", hideTranslation: "Masquer la traduction", replyTitle: "Voulez-vous confier une réponse ?", replyHelp: "L’original de votre réponse est conservé tel quel, et vos coordonnées ne sont pas dévoilées à l’autre personne. Cette réponse pourra attendre, comme un nouveau message, la personne qui viendra après vous.", placeholder: "Écrivez un petit mot ou une question.", pass: "Passer pour cette fois", withdraw: "Retirer cette mise en relation", send: "Confier la réponse", sent: "Votre réponse nous a été confiée.", passed: "Pour cette fois, ce message passe son chemin en silence.", withdrawn: "Cette mise en relation a été retirée.", error: "Le message n’a pas pu être chargé. Vérifiez le lien.", loading: "Chargement du message…", mine: "Ma position", sender: "Position de la personne qui a laissé le message" },
  es: { label: "〈39 y más〉 · Coordenadas de un saludo", title: "Coordenadas de un saludo", lead: "Saludos que se dejan entre registros distintos. Esta posición no es un tipo de persona: es una dirección leída en este registro, y puede cambiar con el tiempo o si cambian las circunstancias. Lea primero el original que le ha llegado y, si lo necesita, abra la traducción.", reason: "Por qué le llegó este saludo", original: "Original", translation: "Ver traducción", hideTranslation: "Ocultar traducción", replyTitle: "¿Quiere confiarnos una respuesta?", replyHelp: "El original de su respuesta también se conserva tal cual, y sus datos de contacto no se muestran a la otra persona. Esta respuesta puede quedar esperando como un nuevo saludo para la próxima persona.", placeholder: "Escriba un saludo breve o una pregunta.", pass: "Esta vez paso", withdraw: "Retirar esta conexión", send: "Confiar la respuesta", sent: "Hemos recibido su respuesta.", passed: "Esta vez, este saludo pasará en silencio.", withdrawn: "Ha retirado esta conexión de saludo.", error: "No hemos podido cargar el saludo. Compruebe el enlace.", loading: "Cargando el saludo…", mine: "Mi posición", sender: "Posición de quien dejó el saludo" },
  nl: { label: "〈39 jaar en ouder〉 · Groetcoördinaten", title: "Groetcoördinaten", lead: "Tussen verschillende verslagen laten we groeten achter. De positie hier is geen type persoon, maar een richting die in dit verslag te lezen is; met de tijd of als de situatie verandert, kan ze verschuiven. Lees eerst de originele tekst die is aangekomen, en open zo nodig de vertaling.", reason: "Waarom deze groet u bereikte", original: "Origineel", translation: "Vertaling bekijken", hideTranslation: "Vertaling verbergen", replyTitle: "Wilt u een antwoord toevertrouwen?", replyHelp: "Ook de oorspronkelijke tekst van uw antwoord wordt ongewijzigd bewaard, en uw contactgegevens worden niet aan de ander getoond. Dit antwoord kan wachten als nieuwe groet voor de volgende.", placeholder: "Schrijf een korte groet of een vraag.", pass: "Deze keer overslaan", withdraw: "Groetverbinding intrekken", send: "Antwoord toevertrouwen", sent: "Uw antwoord is toevertrouwd.", passed: "Deze groet gaat deze keer rustig voorbij.", withdrawn: "Deze groetverbinding is ingetrokken.", error: "De groet kon niet worden geladen. Controleer de link nog eens.", loading: "De groet wordt geladen.", mine: "Mijn positie", sender: "Positie van de afzender" },
  ms: { label: "〈39 tahun ke atas〉 · Koordinat Salam", title: "Koordinat Salam", lead: "Salam ditinggalkan di antara rekod yang berbeza. Kedudukan di sini bukan jenis seseorang, tetapi arah yang dibaca dalam rekod ini, dan ia boleh berubah apabila masa berlalu atau keadaan berubah. Baca dahulu teks asal yang tiba, kemudian buka terjemahan jika perlu.", reason: "Mengapa salam ini sampai kepada anda", original: "Teks asal", translation: "Lihat terjemahan", hideTranslation: "Tutup terjemahan", replyTitle: "Mahu amanahkan balasan?", replyHelp: "Teks asal balasan anda juga disimpan tanpa diubah, dan maklumat hubungan anda tidak didedahkan kepada penerimanya. Balasan ini boleh menunggu sebagai salam baharu untuk orang seterusnya.", placeholder: "Tulis ucapan ringkas atau soalan.", pass: "Saya biarkan ia berlalu kali ini", withdraw: "Tarik balik hubungan salam ini", send: "Amanahkan balasan", sent: "Balasan anda telah diamanahkan.", passed: "Salam ini berlalu dengan tenang kali ini.", withdrawn: "Hubungan salam ini telah ditarik balik.", error: "Salam tidak dapat dimuatkan. Sila semak pautan sekali lagi.", loading: "Sedang memuatkan salam.", mine: "Kedudukan saya", sender: "Kedudukan orang yang menghantar salam" },
};

// A received greeting does not travel back to the original sender. A new
// sentence can become a greeting for a later participant, so the public
// language must not imply a direct-reply channel.
const forwardingCopy = {
  ko: { title: "이 안부를 읽고 다음 사람에게 한 문장 남기기", help: "남긴 문장은 원문 그대로 보존하며 연락처는 누구에게도 공개하지 않습니다. 이 문장은 다음 사람에게 이어질 새 안부로 기다립니다.", send: "다음 안부 맡기기", sent: "다음 안부를 맡겼습니다.", notificationTitle: "다음 안부가 도착하면 이메일로 알려드릴까요?", notificationHelp: "이메일은 안부함 링크를 보내는 데만 사용하며, 다른 참여자에게 보이지 않습니다. 새 안부가 도착하면 연구팀이 이 주소로 알림 메일을 보냅니다.", notificationLabel: "알림을 받을 이메일", notificationConsent: "이 이메일을 다음 안부 도착 알림에만 사용해도 괜찮아요.", notificationSave: "알림 요청 저장", notificationStored: "알림 요청을 저장했습니다. 새 안부가 도착하면 연구팀이 알림 메일을 보냅니다." },
  en: { title: "Read this greeting, then leave a sentence for the next person", help: "Your sentence is kept exactly as you wrote it, and your contact details are not shown to anyone. It will wait as a new greeting for the next person.", send: "Leave the next greeting", sent: "The next greeting is in our care.", notificationTitle: "Would you like an email when the next greeting arrives?", notificationHelp: "Your email is used only to send you a link to your greeting box, and is not shown to other participants. When a new greeting arrives, the research team will send a notification to this address.", notificationLabel: "Email for notices", notificationConsent: "You may use this email only to let me know when the next greeting arrives.", notificationSave: "Save notification request", notificationStored: "Your request has been saved. When a new greeting arrives, the research team will send you a notification email." },
  ja: { title: "このあいさつを読み、次の人へ一文を残す", help: "残した文章は原文のまま保管され、連絡先は誰にも公開されません。この一文は新しいあいさつとして、次の人に届くのを待ちます。", send: "次のあいさつを託す", sent: "次のあいさつを託しました。", notificationTitle: "次のあいさつが届いたら、メールでお知らせしましょうか？", notificationHelp: "メールアドレスは、あいさつ箱へのリンクを送るためだけに使い、他の参加者には見せません。新しいあいさつが届くと、研究チームがこのアドレスへお知らせメールを送ります。", notificationLabel: "通知を受けるメールアドレス", notificationConsent: "このメールアドレスを、次のあいさつの到着通知だけに使ってかまいません。", notificationSave: "通知の依頼を保存", notificationStored: "通知のご希望を保存しました。新しいあいさつが届くと、研究チームがお知らせメールを送ります。" },
  "zh-Hans": { title: "读完这封问候，给下一位留一句话", help: "您留下的话会按原文保存，联系方式不会向任何人公开。这句话会作为一封新的问候，等着送到下一位那里。", send: "寄出给下一位的问候", sent: "给下一位的问候已寄出。", notificationTitle: "下一封问候到达时，要通过邮件通知您吗？", notificationHelp: "邮箱只用于发送问候箱的链接，其他参与者看不到。有新的问候到达时，研究团队会向这个地址发送通知邮件。", notificationLabel: "接收通知的邮箱", notificationConsent: "我同意这个邮箱只用于下一封问候的到达通知。", notificationSave: "保存通知请求", notificationStored: "通知请求已保存。有新的问候到达时，研究团队会发送通知邮件。" },
  "zh-Hant": { title: "讀完這則問候，為下一位留下一句話", help: "您留下的話會以原文完整保留，聯絡方式不會向任何人公開。這句話會成為一則新的問候，等著傳給下一位。", send: "託付下一則問候", sent: "下一則問候已託付。", notificationTitle: "下一則問候寄到時，要用電子郵件通知您嗎？", notificationHelp: "電子郵件只用來寄送問候箱的連結，其他參與者看不到。有新的問候寄到時，研究團隊會寄通知信到這個地址。", notificationLabel: "接收通知的電子郵件", notificationConsent: "我同意這個電子郵件只用於下一則問候的到達通知。", notificationSave: "儲存通知請求", notificationStored: "通知請求已儲存。有新的問候寄到時，研究團隊會寄出通知信。" },
  fr: { title: "Après avoir lu ce message, laisser une phrase à qui viendra ensuite", help: "Votre phrase est conservée telle que vous l’avez écrite, et vos coordonnées ne sont dévoilées à personne. Elle attendra, comme un nouveau message, la personne qui viendra après vous.", send: "Confier le prochain message", sent: "Votre nouveau message nous a été confié.", notificationTitle: "Souhaitez-vous recevoir un e-mail à l’arrivée du prochain message ?", notificationHelp: "Votre adresse sert uniquement à vous envoyer le lien de votre boîte à messages ; elle n’est pas visible par les autres personnes participantes. Lorsqu’un nouveau message arrive, l’équipe de recherche vous écrit à cette adresse pour vous en avertir.", notificationLabel: "Adresse e-mail pour les notifications", notificationConsent: "J’accepte que cette adresse serve uniquement à me prévenir de l’arrivée du prochain message.", notificationSave: "Enregistrer la demande", notificationStored: "Votre demande est enregistrée. Lorsqu’un nouveau message arrivera, l’équipe de recherche vous enverra un e-mail de notification." },
  es: { title: "Después de leer este saludo, deje una frase para la próxima persona", help: "Su frase se conserva tal como la escribió, y sus datos de contacto no se muestran a nadie. Esta frase quedará esperando como un nuevo saludo para la próxima persona.", send: "Confiar el siguiente saludo", sent: "Hemos recibido su saludo para la próxima persona.", notificationTitle: "¿Quiere que le avisemos por correo cuando llegue el próximo saludo?", notificationHelp: "Su correo solo se usa para enviarle el enlace a su buzón de saludos y no se muestra a otras personas participantes. Cuando llegue un nuevo saludo, el equipo de investigación le enviará un aviso a esta dirección.", notificationLabel: "Correo para avisos", notificationConsent: "Pueden usar este correo solo para avisarme cuando llegue el próximo saludo.", notificationSave: "Guardar solicitud de aviso", notificationStored: "Hemos guardado su solicitud. Cuando llegue un nuevo saludo, el equipo de investigación le enviará un correo de aviso." },
  nl: { title: "Na deze groet één zin achterlaten voor de volgende", help: "Uw zin wordt ongewijzigd bewaard en uw contactgegevens worden aan niemand getoond. De zin wacht als nieuwe groet op de volgende.", send: "Volgende groet toevertrouwen", sent: "De volgende groet is toevertrouwd.", notificationTitle: "Zullen we u mailen wanneer er een volgende groet aankomt?", notificationHelp: "We gebruiken uw e-mailadres alleen om u een link naar uw groetenbus te sturen; andere deelnemers zien het niet. Komt er een nieuwe groet aan, dan stuurt het onderzoeksteam een melding naar dit adres.", notificationLabel: "E-mailadres voor meldingen", notificationConsent: "Dit e-mailadres mag alleen gebruikt worden voor een melding als er een volgende groet aankomt.", notificationSave: "Meldingsverzoek opslaan", notificationStored: "Uw verzoek is opgeslagen. Wanneer een nieuwe groet aankomt, stuurt het onderzoeksteam een e-mail." },
  ms: { title: "Selepas membaca salam ini, tinggalkan satu ayat untuk orang seterusnya", help: "Ayat anda disimpan seperti asal, dan maklumat hubungan anda tidak didedahkan kepada sesiapa. Ayat ini akan menunggu sebagai salam baharu untuk orang seterusnya.", send: "Amanahkan salam seterusnya", sent: "Salam seterusnya telah diamanahkan.", notificationTitle: "Mahukah kami memberitahu anda melalui e-mel apabila salam seterusnya tiba?", notificationHelp: "E-mel anda hanya digunakan untuk menghantar pautan peti salam dan tidak dipaparkan kepada peserta lain. Apabila salam baharu tiba, pasukan penyelidik akan menghantar e-mel pemberitahuan ke alamat ini.", notificationLabel: "E-mel untuk pemberitahuan", notificationConsent: "E-mel ini boleh digunakan hanya untuk pemberitahuan ketibaan salam seterusnya.", notificationSave: "Simpan permintaan pemberitahuan", notificationStored: "Permintaan pemberitahuan anda telah disimpan. Apabila salam baharu tiba, pasukan penyelidik akan menghantar e-mel pemberitahuan." },
};

const receiptCopy = {
  ko: { senderContext: "이 안부를 남긴 사람", finishHere: "여기에서 마치기" },
  en: { senderContext: "The person who left this greeting", finishHere: "Finish here" },
  ja: { senderContext: "このあいさつを残した人", finishHere: "ここで終える" },
  "zh-Hans": { senderContext: "留下这封问候的人", finishHere: "在这里结束" },
  "zh-Hant": { senderContext: "留下這則問候的人", finishHere: "在這裡結束" },
  fr: { senderContext: "La personne qui a laissé ce message", finishHere: "Terminer ici" },
  es: { senderContext: "La persona que dejó este saludo", finishHere: "Terminar aquí" },
  nl: { senderContext: "Wie deze groet achterliet", finishHere: "Hier afsluiten" },
  ms: { senderContext: "Orang yang meninggalkan salam ini", finishHere: "Selesai di sini" },
};

const task10a4ReceiptCopy = {
  ko: { receivedTitle: "안부 한 통이 도착했습니다.", receivedHelp: "먼저 이곳을 지나간 한 사람이 남긴 문장입니다. 천천히 읽어보세요.", receivedHelpSeed: "프로젝트가 준비한 첫 안부입니다. 천천히 읽어보세요.", receivedHelpResearcher: "연구팀이 확인해 전달한 문장입니다. 천천히 읽어보세요.", arrivalReasonLabel: "이 안부가 닿은 이유", arrivalReason: "이 문장을 쓴 사람은 받을 사람을 모른 채, 다음에 이곳에 올 누군가를 떠올리며 썼어요. 오늘 그 누군가가 당신이었어요.", arrivalReasonSeed: "지금 전해 드릴 수 있는, 앞서 남겨진 안부가 아직 없어 이 문장으로 시작합니다. 마지막에 남기시는 한 문장은 다음 사람에게 먼저 도착하는 안부가 될 수 있어요.", reasonSummary: "두 기록에 함께 남은 현재의 흐름과 관계의 단서를 바탕으로 이어진 안부입니다. 이번 기록에서 읽힌 맥락이라 시간이 지나면 달라질 수 있습니다." },
  en: { receivedTitle: "A greeting has arrived.", receivedHelp: "These words were left by someone who passed this way before you. Take your time with them.", receivedHelpSeed: "This is the first greeting, prepared by the project. Take your time with it.", receivedHelpResearcher: "These words were checked and passed on by the research team. Take your time with them.", arrivalReasonLabel: "Why this greeting reached you", arrivalReason: "The person who wrote this didn’t know who would receive it. They wrote it thinking of whoever would come here next. Today, that someone was you.", arrivalReasonSeed: "There is no earlier greeting we can pass on to you yet, so we begin with this one. The sentence you leave at the end may become the first greeting the next person receives.", reasonSummary: "This greeting was connected through clues, found in both records, about how things are moving now and about relationships. Because this context was read from these records, it may change over time." },
  ja: { receivedTitle: "あいさつが一通届きました。", receivedHelp: "ひと足先にここを通った方が残した言葉です。ゆっくり読んでみてください。", receivedHelpSeed: "プロジェクトが用意した最初のあいさつです。ゆっくりお読みください。", receivedHelpResearcher: "研究チームが確認して届けた文章です。ゆっくりお読みください。", arrivalReasonLabel: "このあいさつが届いた理由", arrivalReason: "これを書いた方は、受け取る人を知らないまま、次にここへ来る誰かを思い浮かべて書きました。今日、その誰かがあなたでした。", arrivalReasonSeed: "今お届けできる、先に残されたあいさつがまだありません。そこでこの文章から始めます。最後に残していただく一文が、次の方に最初に届くあいさつになるかもしれません。", reasonSummary: "二つの記録にともに残った現在の流れと関係の手がかりをもとにつながったあいさつです。今回の記録から読まれた文脈なので、時間がたてば変わることがあります。" },
  "zh-Hans": { receivedTitle: "一封问候到了。", receivedHelp: "这是一位先经过这里的人留下的话。请慢慢读。", receivedHelpSeed: "这是项目准备的第一封问候。请慢慢读。", receivedHelpResearcher: "这是研究团队确认后转来的话。请慢慢读。", arrivalReasonLabel: "这封问候为何来到您这里", arrivalReason: "写下这段话的人并不知道谁会收到，是想着下一个来到这里的人写下的。今天，那个人就是您。", arrivalReasonSeed: "目前还没有之前留下、可以送到您这里的问候，所以先从这句话开始。您最后留下的那句话，可能会成为先到达下一位的问候。", reasonSummary: "这封问候，是根据两份记录中共同留下的当下流向与关系线索牵起的。这是从这次记录中读出的脉络，过一段时间可能会有所不同。" },
  "zh-Hant": { receivedTitle: "有一則問候寄到了。", receivedHelp: "這是一位先來過這裡的人留下的話。請慢慢讀。", receivedHelpSeed: "這是本計畫準備的第一則問候。請慢慢讀。", receivedHelpResearcher: "這是研究團隊確認後轉達的句子。請慢慢讀。", arrivalReasonLabel: "這則問候送到您這裡的原因", arrivalReason: "寫下這段話的人並不知道誰會收到，只是想著下一個來到這裡的人寫下了它。今天，那個人就是您。", arrivalReasonSeed: "目前還沒有先前留下、可以轉交給您的問候，所以先從這句話開始。您最後留下的一句話，可能會成為下一位最先收到的問候。", reasonSummary: "這則問候，是依兩份記錄中共同留下的當下流向與關係線索而牽起的。這是從這次記錄讀出的脈絡，時間過去後也可能改變。" },
  fr: { receivedTitle: "Un message est arrivé pour vous.", receivedHelp: "Ces mots ont été laissés par une personne passée par ici avant vous. Prenez le temps de les lire.", receivedHelpSeed: "C’est le premier message, préparé par le projet. Prenez le temps de le lire.", receivedHelpResearcher: "Cette phrase a été vérifiée et transmise par l’équipe de recherche. Prenez le temps de la lire.", arrivalReasonLabel: "Pourquoi ce message vous est parvenu", arrivalReason: "Sans savoir qui la recevrait, la personne qui a écrit cette phrase pensait à quelqu’un qui viendrait ici après elle. Aujourd’hui, ce quelqu’un, c’était vous.", arrivalReasonSeed: "Aucun message laissé avant vous ne peut encore vous être transmis ; nous commençons donc par celui-ci. La phrase que vous laisserez à la fin pourra devenir le premier message que trouvera la personne qui viendra après vous.", reasonSummary: "Ce message vous est parvenu à partir d’indices communs aux deux récits : le mouvement présent et les relations. C’est le contexte qu’on y lit aujourd’hui ; il peut changer avec le temps." },
  es: { receivedTitle: "Ha llegado un saludo.", receivedHelp: "Esta frase la dejó una persona que pasó por aquí antes. Léala con calma.", receivedHelpSeed: "Este es el primer saludo preparado por el proyecto. Léalo con calma.", receivedHelpResearcher: "Es una frase que el equipo de investigación revisó y le ha hecho llegar. Léala con calma.", arrivalReasonLabel: "Por qué le llegó este saludo", arrivalReason: "Quien escribió esta frase no sabía quién la recibiría: pensaba en la próxima persona que llegara aquí. Hoy, esa persona ha sido usted.", arrivalReasonSeed: "Todavía no hay ningún saludo anterior que podamos hacerle llegar, así que empezamos con esta frase. La que usted deje al final puede ser el saludo que le llegue primero a la próxima persona.", reasonSummary: "Este saludo le llegó a partir de pistas sobre el rumbo actual y las relaciones que aparecen en ambos registros. Es un contexto leído en estos registros, así que puede cambiar con el tiempo." },
  nl: { receivedTitle: "Er is een groet voor u aangekomen.", receivedHelp: "Iemand die hier eerder langskwam, heeft deze woorden achtergelaten. Lees ze op uw gemak.", receivedHelpSeed: "Dit is de eerste groet, klaargezet door het project. Lees hem op uw gemak.", receivedHelpResearcher: "Deze zin is door het onderzoeksteam nagekeken en doorgegeven. Lees hem op uw gemak.", arrivalReasonLabel: "Waarom deze groet u bereikte", arrivalReason: "Wie dit schreef, wist niet wie het zou krijgen, en dacht bij het schrijven aan iemand die hier later zou komen. Vandaag was u die iemand.", arrivalReasonSeed: "Er is nog geen eerder achtergelaten groet die we u nu kunnen geven, daarom beginnen we met deze zin. De zin die u aan het eind achterlaat, kan de groet worden die als eerste bij de volgende aankomt.", reasonSummary: "Deze groet kwam bij u terecht via aanwijzingen over de huidige beweging en relaties die in beide verslagen staan. Die context is in deze verslagen gelezen en kan met de tijd veranderen." },
  ms: { receivedTitle: "Satu salam telah tiba.", receivedHelp: "Ini kata-kata yang ditinggalkan oleh seseorang yang lebih dahulu singgah di sini. Bacalah perlahan-lahan.", receivedHelpSeed: "Ini salam pertama yang disediakan oleh projek. Bacalah perlahan-lahan.", receivedHelpResearcher: "Ayat ini disemak dan disampaikan oleh pasukan penyelidik. Bacalah perlahan-lahan.", arrivalReasonLabel: "Mengapa salam ini sampai kepada anda", arrivalReason: "Penulisnya tidak tahu siapa yang akan menerimanya; dia menulis sambil membayangkan seseorang yang akan datang ke sini selepas itu. Hari ini, seseorang itu ialah anda.", arrivalReasonSeed: "Belum ada salam terdahulu yang dapat kami sampaikan kepada anda sekarang, jadi kami mulakan dengan ayat ini. Ayat yang anda tinggalkan pada akhir nanti boleh menjadi salam yang tiba lebih dahulu kepada orang seterusnya.", reasonSummary: "Salam ini disambungkan berdasarkan petunjuk tentang aliran semasa dan hubungan yang terdapat dalam kedua-dua rekod. Konteks ini dibaca daripada rekod kali ini, jadi ia boleh berubah mengikut masa." },
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

// 설문 쪽 안부와 같은 한도를 쓴다. 전에는 여기만 1,400자였다.
const RELAY_MESSAGE_MAX = 600;

const composeCopy = {
  ko: { begin: "이 안부를 읽고 다음 사람에게 한 문장 남기기", visibility: "상대에게 보이는 표기를 골라주세요.", named: "이름 또는 선택한 표기를 보여줘도 괜찮아요", contextual: "역할·지역 정도만 보여주세요", anonymous: "익명으로 남길게요", translation: "다른 언어권의 사람에게 닿을 때 번역을 함께 보여줄까요?", translationYes: "원문과 번역을 함께 보여주세요", translationNo: "원문만 보여주세요", translationNote: "다른 언어를 쓰는 사람에게 닿을 때는 원문과 함께 번역이 갑니다.", preview: "상대에게 보이는 내용 확인하기", previewTitle: "상대에게 보이는 내용", confirm: "연락처와 설문 전체가 전달되지 않는 것을 확인했고, 이 문장을 다음 사람에게 맡길게요.", back: "문장 다시 보기" },
  en: { begin: "Read this greeting, then leave a sentence for the next person", visibility: "Choose how you will appear to the other person.", named: "You can show my name or chosen label", contextual: "Show only my role or region", anonymous: "I’ll leave it anonymously", translation: "If it reaches someone who reads another language, should a translation go with it?", translationYes: "Show the original and a translation", translationNo: "Show the original only", translationNote: "If it reaches someone who uses another language, a translation goes with your original.", preview: "Check what the other person will see", previewTitle: "What the other person sees", confirm: "I understand that my contact details and full survey answers are not passed on, and I’ll leave this sentence for the next person.", back: "Back to my sentence" },
  ja: { begin: "このあいさつを読み、次の人へ一文を残す", visibility: "相手に見せる呼び方を選んでください。", named: "名前、または選んだ呼び方を見せる", contextual: "役割・地域だけを見せる", anonymous: "匿名で残す", translation: "別の言語を使う人に届くとき、翻訳も一緒に見せますか？", translationYes: "原文と翻訳を一緒に見せる", translationNo: "原文だけを見せる", translationNote: "ほかの言語を使う方に届くときは、原文と一緒に翻訳も届きます。", preview: "相手に見える内容を確認する", previewTitle: "相手に見える内容", confirm: "連絡先と調査の回答全体が相手に渡らないことを確認し、この一文を次の人へ託します。", back: "文章を見直す" },
  "zh-Hans": { begin: "读完这封问候，给下一位留一句话", visibility: "请选择对方会看到的署名。", named: "可以显示名字或选定的称呼", contextual: "只显示角色、地区等", anonymous: "匿名留下", translation: "送到使用其他语言的人那里时，要同时显示译文吗？", translationYes: "请同时显示原文和译文", translationNo: "请只显示原文", translationNote: "如果送到使用其他语言的人那里，原文会附上译文一起送去。", preview: "预览对方看到的内容", previewTitle: "对方会看到的内容", confirm: "我已确认联系方式和完整问卷不会被转交，并把这句话寄给下一位。", back: "再看一遍这句话" },
  "zh-Hant": { begin: "讀完這則問候，為下一位留下一句話", visibility: "請選擇對方看到的署名方式。", named: "顯示姓名或我選的稱呼", contextual: "只顯示角色、地區就好", anonymous: "匿名留下", translation: "送到其他語言圈的人手上時，要一起顯示翻譯嗎？", translationYes: "同時顯示原文和翻譯", translationNo: "只顯示原文", translationNote: "送到使用其他語言的人手中時，譯文會與原文一起送達。", preview: "確認對方會看到的內容", previewTitle: "對方會看到的內容", confirm: "我已確認聯絡方式和完整問卷都不會傳出去，要把這句話託付給下一位。", back: "重新查看句子" },
  fr: { begin: "Après avoir lu ce message, laisser une phrase à qui viendra ensuite", visibility: "Choisissez comment vous apparaîtrez à l’autre personne.", named: "Afficher mon nom ou le nom que j’ai choisi", contextual: "N’afficher que mon rôle ou ma région", anonymous: "Rester anonyme", translation: "Si votre message parvient à quelqu’un qui parle une autre langue, voulez-vous qu’une traduction l’accompagne ?", translationYes: "Afficher l’original et la traduction", translationNo: "Afficher seulement l’original", translationNote: "Si votre message parvient à une personne qui lit une autre langue, une traduction accompagne votre texte original.", preview: "Voir ce que l’autre personne verra", previewTitle: "Ce que la personne verra", confirm: "J’ai bien noté que mes coordonnées et l’ensemble de mes réponses ne sont pas transmis, et je confie cette phrase à qui viendra après moi.", back: "Revoir la phrase" },
  es: { begin: "Después de leer este saludo, deje una frase para la próxima persona", visibility: "Elija cómo quiere aparecer ante quien lo reciba.", named: "Mostrar mi nombre o el nombre que elegí", contextual: "Mostrar solo mi papel o mi región", anonymous: "Dejarlo de forma anónima", translation: "Si llega a alguien que habla otro idioma, ¿quiere que mostremos también una traducción?", translationYes: "Mostrar el original y la traducción", translationNo: "Mostrar solo el original", translationNote: "Si llega a alguien que habla otro idioma, esa persona recibirá su texto original junto con una traducción.", preview: "Revisar lo que verá la otra persona", previewTitle: "Lo que verá la persona", confirm: "Entiendo que no se comparten ni mis datos de contacto ni la encuesta completa, y confío esta frase a la próxima persona.", back: "Revisar la frase" },
  nl: { begin: "Na deze groet één zin achterlaten voor de volgende", visibility: "Kies onder welke naam de ontvanger u ziet.", named: "Toon mijn naam of de naam die ik koos", contextual: "Toon alleen mijn rol of regio", anonymous: "Ik blijf anoniem", translation: "Komt uw groet terecht bij iemand die een andere taal spreekt, wilt u dan dat er ook een vertaling bij staat?", translationYes: "Toon origineel en vertaling", translationNo: "Toon alleen het origineel", translationNote: "Komt uw groet terecht bij iemand die een andere taal spreekt, dan gaat er een vertaling mee, naast uw oorspronkelijke tekst.", preview: "Bekijk wat de ontvanger ziet", previewTitle: "Wat de ontvanger ziet", confirm: "Ik heb gezien dat mijn contactgegevens en mijn ingevulde vragenlijst als geheel niet worden doorgegeven, en ik vertrouw deze zin toe aan de volgende.", back: "Zin herlezen" },
  ms: { begin: "Selepas membaca salam ini, tinggalkan satu ayat untuk orang seterusnya", visibility: "Pilih bagaimana anda dipaparkan kepada penerima.", named: "Paparkan nama atau nama paparan pilihan saya", contextual: "Paparkan peranan dan kawasan sahaja", anonymous: "Tinggalkan salam ini tanpa nama", translation: "Apabila salam ini sampai kepada seseorang yang menggunakan bahasa lain, adakah anda mahu terjemahan turut dipaparkan?", translationYes: "Paparkan teks asal dan terjemahan", translationNo: "Paparkan teks asal sahaja", translationNote: "Jika salam ini sampai kepada seseorang yang menggunakan bahasa lain, terjemahan akan dihantar bersama teks asal.", preview: "Semak apa yang penerima akan lihat", previewTitle: "Apa yang dilihat penerima", confirm: "Saya faham bahawa maklumat hubungan dan keseluruhan soal selidik saya tidak disampaikan, dan saya akan mengamanahkan ayat ini kepada orang seterusnya.", back: "Lihat semula ayat" },
};

// Structured v3 reason snapshots are deliberately made from category codes,
// not translated respondent text. That lets the same factual explanation be
// shown in the recipient's language while legacy v2 snapshots remain intact.
const greetingReasonCopy = {
  ko: { map: "두 기록에서 읽힌 현재 위치", sender: { MAKING: "작업을 만들어 온 참여자", CONNECTING: "작업과 사람을 이어 온 참여자", READING: "작업을 읽고 기록해 온 참여자", PERFORMANCE: "공연과 연습을 이어 온 참여자", EDUCATION: "교육과 배움을 통해 문화예술을 이어 온 참여자", EVERYDAY: "생활 안에서 문화예술 활동을 이어 온 참여자", CULTURAL_RELATION: "문화예술과 관계를 이어 온 참여자" }, summary: "이 안부는 두 기록에서 가까이 나타난 방향과 역할, 고른 연결 방향을 함께 읽어 전했습니다. 이 위치는 시간이 지나거나 상황이 달라지면 달라질 수 있습니다.", SAME_DIRECTION: "두 기록 모두 가까운 한 방향이 남아 있습니다.", ADJACENT_DIRECTION: "두 기록의 방향 가운데 일부가 이웃해 있습니다.", ROLE_BRIDGE: "서로 다른 역할의 자리에서 비슷한 질문이 이어졌습니다." },
  en: { map: "Current positions read in the two records", sender: { MAKING: "a participant who has been making work", CONNECTING: "a participant who has been connecting work and people", READING: "a participant who has been reading and documenting work", PERFORMANCE: "a participant who has kept up performance and practice", EDUCATION: "a participant who has stayed connected to arts and culture through teaching and learning", EVERYDAY: "a participant who has kept up arts and culture activity in everyday life", CULTURAL_RELATION: "a participant who has remained in relation with arts and culture" }, summary: "This greeting was passed on by reading together the directions and roles that came out close in both records, and the direction of connection chosen. This position can change as time passes or circumstances change.", SAME_DIRECTION: "Both records share one closely matching direction.", ADJACENT_DIRECTION: "Some of the directions in the two records sit next to each other.", ROLE_BRIDGE: "A similar question has continued across different roles." },
  ja: { map: "二つの記録から読まれた現在の位置", sender: { MAKING: "制作を続けてきた参加者", CONNECTING: "作品と人をつないできた参加者", READING: "作品を読み、記録してきた参加者", PERFORMANCE: "公演と練習を続けてきた参加者", EDUCATION: "教育と学びを通して文化芸術を続けてきた参加者", EVERYDAY: "生活の中で文化芸術活動を続けてきた参加者", CULTURAL_RELATION: "文化芸術との関係を続けてきた参加者" }, summary: "このあいさつは、二つの記録で近くに現れた方向、現在の役割、選ばれたつながりの方向をあわせて読んで届けられました。この位置は時間や状況によって変わることがあります。", SAME_DIRECTION: "二つの記録のどちらにも、近い一つの方向が残っています。", ADJACENT_DIRECTION: "二つの記録の方向の一部が隣り合っています。", ROLE_BRIDGE: "異なる役割の立場から、似た問いが続いています。" },
  "zh-Hans": { map: "从两份记录中读出的当前位置", sender: { MAKING: "一位一直在创作的参与者", CONNECTING: "一位一直为作品与人牵线的参与者", READING: "一位一直在解读、记录作品的参与者", PERFORMANCE: "一位一直在演出、练习的参与者", EDUCATION: "一位通过教学与学习延续文化艺术的参与者", EVERYDAY: "一位在日常生活中延续文化艺术活动的参与者", CULTURAL_RELATION: "一位一直与文化艺术保持联系的参与者" }, summary: "这封问候，是结合两份记录里相近的方向、角色，以及所选的牵线方向后送来的。随着时间推移或情况变化，这个位置可能会改变。", SAME_DIRECTION: "两份记录里都留有一个相近的方向。", ADJACENT_DIRECTION: "两份记录的方向中，有一部分彼此相邻。", ROLE_BRIDGE: "在不同角色的位置上，延续着相似的问题。" },
  "zh-Hant": { map: "從兩份記錄讀出的目前位置", sender: { MAKING: "一位持續創作的參與者", CONNECTING: "一位持續連結作品與他人的參與者", READING: "一位持續閱讀並記錄作品的參與者", PERFORMANCE: "一位持續表演與練習的參與者", EDUCATION: "一位透過教育與學習延續文化藝術的參與者", EVERYDAY: "一位在日常生活中持續參與文化藝術的參與者", CULTURAL_RELATION: "一位持續與文化藝術保持關係的參與者" }, summary: "這則問候，是綜合兩份記錄中相近的方向、角色，以及所選的連結方向後送出的。這個位置可能隨時間或情況改變。", SAME_DIRECTION: "兩份記錄中都出現了一個相近的方向。", ADJACENT_DIRECTION: "兩份記錄中的部分方向彼此相鄰。", ROLE_BRIDGE: "從不同角色的位置出發，延續著相似的問題。" },
  fr: { map: "Positions actuelles lues dans les deux récits", sender: { MAKING: "une personne participante qui crée", CONNECTING: "une personne participante qui relie les œuvres et les personnes", READING: "une personne participante qui lit les œuvres et en garde trace", PERFORMANCE: "une personne participante qui continue de répéter et de monter sur scène", EDUCATION: "une personne participante qui poursuit les arts et la culture par l’enseignement et l’apprentissage", EVERYDAY: "une personne participante qui poursuit les arts et la culture dans la vie quotidienne", CULTURAL_RELATION: "une personne participante qui reste en relation avec les arts et la culture" }, summary: "Ce message vous a été transmis en croisant les directions proches dans les deux récits, les rôles et la direction de lien choisie. Cette position peut changer avec le temps ou les circonstances.", SAME_DIRECTION: "Une direction proche apparaît dans les deux récits.", ADJACENT_DIRECTION: "Certaines directions des deux récits sont voisines.", ROLE_BRIDGE: "Depuis des rôles différents, une question semblable s’est poursuivie." },
  es: { map: "Posiciones actuales leídas en los dos registros", sender: { MAKING: "una persona participante que ha seguido creando", CONNECTING: "una persona participante que ha conectado obras y personas", READING: "una persona participante que ha leído y documentado obras", PERFORMANCE: "una persona participante que ha seguido actuando y ensayando", EDUCATION: "una persona participante que ha seguido en el arte y la cultura a través de la enseñanza y el aprendizaje", EVERYDAY: "una persona participante que ha mantenido una actividad artística o cultural en su vida cotidiana", CULTURAL_RELATION: "una persona participante que ha mantenido una relación con las artes y la cultura" }, summary: "Este saludo le llegó tras leer a la vez las direcciones y los papeles que aparecían cercanos en ambos registros, y la dirección de conexión elegida. Esta posición puede cambiar con el tiempo o si cambian las circunstancias.", SAME_DIRECTION: "Los dos registros comparten una dirección cercana.", ADJACENT_DIRECTION: "Algunas direcciones de los dos registros están próximas entre sí.", ROLE_BRIDGE: "Desde papeles distintos, han surgido preguntas parecidas." },
  nl: { map: "Huidige posities uit de twee verslagen", sender: { MAKING: "een deelnemer die werk maakt", CONNECTING: "een deelnemer die werk en mensen verbindt", READING: "een deelnemer die werk leest en documenteert", PERFORMANCE: "een deelnemer die is blijven optreden en oefenen", EDUCATION: "een deelnemer die via onderwijs en leren met kunst en cultuur bezig is gebleven", EVERYDAY: "een deelnemer die in het dagelijks leven met kunst en cultuur bezig is gebleven", CULTURAL_RELATION: "een deelnemer die verbonden blijft met kunst en cultuur" }, summary: "Deze groet is doorgegeven op basis van de richtingen en rollen die in beide verslagen dicht bij elkaar liggen, en de gekozen richting voor de verbinding. Die positie kan veranderen met de tijd of als de situatie verandert.", SAME_DIRECTION: "Beide verslagen delen een verwante richting.", ADJACENT_DIRECTION: "Enkele richtingen in de twee verslagen liggen naast elkaar.", ROLE_BRIDGE: "Vanuit verschillende rollen kwam een vergelijkbare vraag naar voren." },
  ms: { map: "Kedudukan semasa yang dibaca daripada dua rekod", sender: { MAKING: "seorang peserta yang selama ini menghasilkan karya", CONNECTING: "seorang peserta yang selama ini menghubungkan karya dengan orang", READING: "seorang peserta yang selama ini membaca dan mendokumentasikan karya", PERFORMANCE: "seorang peserta yang selama ini meneruskan persembahan dan latihan", EDUCATION: "seorang peserta yang selama ini meneruskan seni dan budaya melalui pendidikan dan pembelajaran", EVERYDAY: "seorang peserta yang selama ini meneruskan kegiatan seni dan budaya dalam kehidupan harian", CULTURAL_RELATION: "seorang peserta yang selama ini menjalin hubungan dengan seni dan budaya" }, summary: "Salam ini disampaikan dengan membaca bersama arah dan peranan yang dekat dalam kedua-dua rekod, serta arah hubungan yang dipilih. Kedudukan ini boleh berubah apabila masa berlalu atau keadaan berubah.", SAME_DIRECTION: "Kedua-dua rekod mempunyai satu arah yang dekat.", ADJACENT_DIRECTION: "Sebahagian arah dalam kedua-dua rekod bersebelahan.", ROLE_BRIDGE: "Soalan yang serupa bersambung dari kedudukan peranan yang berbeza." },
};

let state = { loading: true, relay: null, error: "", result: "", notification: "", composeStep: "read", draft: { message: "", sender_visibility: "", translation_allowed: "YES", confirmed: false } };
// 홍콩판(zh-Hant-HK)은 번체에서 만든다 — hong-kong.js(2026-10-01). 이 파일은 읽는 도중에 화면을 그리므로
// (링크가 틀리면 곧바로 안내를 띄운다) 맨 끝이 아니라 사전 바로 아래에서 만든다.
[copy, forwardingCopy, receiptCopy, task10a4ReceiptCopy, composeCopy, greetingReasonCopy].forEach(withHongKong);

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
  // 발신자 표시는 참여자가 「이름 또는 선택한 표기」를 명시적으로 고르고 그 표기가 실제로
  // 있을 때만 한다. 역할 문장("작업을 만드는 참여자")은 어떤 판본에서도 그리지 않는다 —
  // 대구 16명 회차에서 역할 하나는 사실상 지목이다. 옛 스냅샷(필드 없음)·CONTEXTUAL·
  // ANONYMOUS는 전부 표시 없음. "이런 사람이 보냈다"는 발신자가 문장 안에 스스로 쓴다.
  if (reason.sender_visibility !== "NAMED" || !reason.sender_display_label) {
    return { sender: "", summary: task10a4Receipt().reasonSummary, evidence: [] };
  }
  const sender = String(reason.sender_display_label);
  const summary = task10a4Receipt().reasonSummary;
  const evidence = structured
    ? (reason.evidence_codes || []).slice(0, 2).map((item) => localized[item?.type]).filter(Boolean)
    : [];
  return { sender, summary, evidence };
}
// 「왜 나에게 왔나」의 참된 답은 유사성이 아니라 순서다 — 앞사람이 '다음 사람'에게 맡겼고,
// 그 다음 사람이 당신이다. 무작위 배달에서도 100% 사실이고 발신자 정보는 0이다.
// 연구팀이 직접 전달한 문장에는 붙이지 않는다.
function arrivalReasonSection(thread, firstMessage) {
  if (!firstMessage || firstMessage.sender_kind === "researcher") return "";
  const reason = thread.connection_reason || {};
  const isSeed = reason.sender_context_code === "PROJECT_SEED" || reason.summary_key === "PROJECT_FIRST_GREETING";
  const receipt = task10a4Receipt();
  // 서버가 고른 근거를 여기서 버리고 모두에게 같은 문장을 보여주고 있었다. 판단으로
  // 고른 안부에는 그 이유가 있고, 그것이 「왜 나에게 왔는가」에 대한 유일한 답이다.
  // 무작위로 떨어졌을 때만 예전 고정 문장으로 돌아간다 — 그때는 정말로 이유가 없다.
  const judged = reason.summary_key === "JUDGED_GREETING" && String(reason.summary || "").trim();
  const body = isSeed ? text(receipt.arrivalReasonSeed) : judged ? text(reason.summary) : text(receipt.arrivalReason);
  const evidence = !isSeed && judged && Array.isArray(reason.evidence)
    ? reason.evidence.filter(Boolean).slice(0, 2).map((line) => `<li>${text(line)}</li>`).join("")
    : "";
  return `<aside class="relay-arrival-reason"><span>${text(receipt.arrivalReasonLabel)}</span><p>${body}</p>${evidence ? `<ul class="relay-arrival-evidence">${evidence}</ul>` : ""}</aside>`;
}
function senderContextSection(thread) {
  const { sender } = reasonDetails(thread);
  return sender ? `<section class="relay-sender-context"><span>${text(receipt().senderContext)}</span><strong>${text(sender)}</strong></section>` : "";
}
// ── 편지함 번역 ────────────────────────────────────────────────────────────
// 편지함은 원문만 보여 줬다. 「번역 보기」 단추가 있었지만 저장된 번역(translated_body)이 있을
// 때만 나왔고 그것을 쓰는 곳이 없어, 사실상 늘 원문뿐이었다. 그래서 다른 말의 안부는 이 자리로
// 보내지 않게 막아 두었다(r66). 이제 도착 화면과 같은 규칙으로 옮긴다(TK 2026-09-23).
//  · 언제 옮기나: greetingTranslationNeeded — 도착 화면과 같은 함수다.
//  · 어떻게 보이나: 읽을 수 있는 글이 편지 자리에, 「위는 기계 번역」 한 줄, 원문은 통째로 아래.
//  · 늦게 와도: 화면 전체를 다시 그리지 않고 그 편지 자리만 갈아 끼운다 — 답장을 쓰던 칸을 지킨다.
//  · 한 번 받은 번역은 이 탭에 남긴다(sessionStorage). 새로고침해도 다시 부르지 않는다.
const aiFunctionUrl = String(window.OVER39_SUPABASE_AI_URL || "").trim();
const supabaseAnonKey = String(window.OVER39_SUPABASE_ANON_KEY || "").trim();
const aiMode = String(window.OVER39_AI_MODE || "fallback").trim();
const messageTranslations = new Map();
let messageTranslationSeq = 0;
const translationStoreKey = (message) => `over39-relay-translation:${message.id}:${interfaceLanguageCode}`;

function storedMessageTranslation(message) {
  try { return JSON.parse(sessionStorage.getItem(translationStoreKey(message)) || "null"); } catch { return null; }
}

function messageTranslationEntry(message) {
  const key = `${message.id}:${interfaceLanguageCode}`;
  if (!messageTranslations.has(key)) {
    const stored = storedMessageTranslation(message);
    if (stored?.status === "ready" && stored.text) messageTranslations.set(key, { status: "ready", text: stored.text });
  }
  return messageTranslations.get(key) || null;
}

function messageView(message) {
  const simplified = simplifiedGreeting();
  const originalLanguage = message.source_language || "";
  const needed = greetingTranslationNeeded(originalLanguage, interfaceLanguageCode);
  const entry = needed ? messageTranslationEntry(message) : null;
  const translated = entry?.status === "ready" ? String(entry.text || "").trim() : "";
  const status = !needed ? "none" : translated ? "ready" : entry?.status === "failed" ? "failed" : "loading";
  const lead = translated || message.body_original || "";
  const leadLanguage = translated ? interfaceLanguageCode : originalLanguage;
  return {
    status,
    long: String(lead).length > GREETING_LONG_CHARS,
    leadHtml: `<p lang="${text(leadLanguage)}">${greetingParagraphsOf(lead).map(text).join("\n\n")}</p>`,
    statusText: status === "loading" ? simplified.arrivalTranslationLoading
      : status === "failed" ? simplified.arrivalTranslationFailed
      : status === "ready" ? simplified.arrivalTranslationNote
      : "",
    retryHtml: status === "failed" ? `<button class="translation-toggle" type="button" data-relay-retry-translation="${text(message.id)}">${text(simplified.arrivalTranslationRetry)}</button>` : "",
    sourceHtml: translated
      ? `<aside class="relay-message-source"><span>${text(simplified.arrivalOriginalLabel.split("{language}").join(languageLabel(originalLanguage)))}</span><blockquote lang="${text(originalLanguage)}">${greetingParagraphsOf(message.body_original).map((part) => `<p>${text(part)}</p>`).join(" ")}</blockquote></aside>`
      : "",
  };
}

// 편지 한 통. 쓴 사람이 비운 줄은 <p> 안의 빈 줄로 남기고 white-space: pre-line 으로 보인다.
function messageBlock(message) {
  const view = messageView(message);
  return `<div class="relay-message-block" data-relay-message-id="${text(message.id)}"><article class="relay-letter${view.long ? " is-long" : ""}" data-relay-lead>${view.leadHtml}</article><div class="relay-translation-state"><p class="relay-translation-status" role="status" aria-live="polite" tabindex="-1" data-relay-status>${text(view.statusText)}</p><span data-relay-retry>${view.retryHtml}</span></div><div data-relay-source>${view.sourceHtml}</div></div>`;
}

function patchMessage(message) {
  const holder = root.querySelector(`[data-relay-message-id="${CSS.escape(String(message.id))}"]`);
  if (!holder) return;
  const view = messageView(message);
  const lead = holder.querySelector("[data-relay-lead]");
  if (lead) { lead.className = `relay-letter${view.long ? " is-long" : ""}`; lead.innerHTML = view.leadHtml; }
  // 알림 줄은 지우지 않고 글자만 바꾼다. 지웠다 새로 만들면 화면 낭독기가 읽지 않는다.
  const status = holder.querySelector("[data-relay-status]");
  if (status) status.textContent = view.statusText;
  const retry = holder.querySelector("[data-relay-retry]");
  const retryHadFocus = retry?.contains(document.activeElement);
  if (retry) retry.innerHTML = view.retryHtml;
  if (retryHadFocus) (retry.querySelector("button") || status)?.focus({ preventScroll: true });
  const source = holder.querySelector("[data-relay-source]");
  if (source) source.innerHTML = view.sourceHtml;
}

function ensureMessageTranslations({ retryId = "" } = {}) {
  const messages = state.relay?.thread?.messages || [];
  for (const message of messages) {
    // 내가 보낸 답장은 옮기지 않는다 — 내가 쓴 말이다. 서버는 보낸 이를 sender_kind 로 알려준다.
    if (message?.sender_kind === "self" || message?.mine) continue;
    if (!message?.id || !greetingTranslationNeeded(message.source_language || "", interfaceLanguageCode)) continue;
    const key = `${message.id}:${interfaceLanguageCode}`;
    const entry = messageTranslationEntry(message);
    if (entry?.status === "ready" || entry?.status === "loading") continue;
    // 실패는 스스로 되풀이하지 않는다. 「다시 옮겨 보기」를 누른 편지만 다시 부른다.
    if (entry?.status === "failed" && String(message.id) !== String(retryId)) continue;
    const token = ++messageTranslationSeq;
    messageTranslations.set(key, { status: "loading", text: "", token });
    patchMessage(message);
    translateArrivedGreeting({
      endpoint: aiFunctionUrl,
      anonKey: supabaseAnonKey,
      mode: aiMode,
      text: message.body_original,
      sourceLanguage: message.source_language,
      targetLanguage: interfaceLanguageCode,
    }).then((result) => {
      if (messageTranslations.get(key)?.token !== token) return;
      const translated = String(result?.translation || "").trim();
      messageTranslations.set(key, { status: translated ? "ready" : "failed", text: translated });
      if (translated) {
        try { sessionStorage.setItem(translationStoreKey(message), JSON.stringify({ status: "ready", text: translated })); } catch { /* 막혀 있어도 화면에는 보인다. */ }
      }
      patchMessage(message);
    });
  }
}
// ── 편지함 번역 끝 ──────────────────────────────────────────────────────────

// 프랑스어 문장부호 빈칸은 그린 뒤에 맞춘다(french-typography.js) — 이 함수는 갈래마다 일찍 돌아가므로 감싸서 한 곳에서.
function render() {
  renderScreen();
  applyFrenchSpacing(root, interfaceLanguageCode);
}

function renderScreen() {
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
    ? `<section class="relay-reply relay-read-actions"><div class="relay-next-prompt"><h2>${text(simplified.continuationTitle)}</h2><p>${text(simplified.continuationHelp)}</p></div><div class="relay-actions relay-next-actions"><button class="primary-button" data-relay-action="begin">${text(simplified.continuationPrimary)} <span aria-hidden="true">→</span></button><button class="secondary-button" data-relay-action="pass">${text(simplified.continuationSecondary)}</button></div></section>`
    : state.composeStep === "write"
      // 예시문과 번역 여부 물음은 뺐다 — 설문 쪽 안부 화면과 같은 이유다(TK 2026-09-23).
      ? `<section class="relay-reply"><h2>${text(simplified.writingTitle)}</h2><p class="greeting-writing-help">${text(simplified.writingHelp)}</p><textarea class="text-input" data-relay-message maxlength="${RELAY_MESSAGE_MAX}" aria-describedby="relay-message-count" placeholder="${text(c().placeholder)}">${text(draft.message)}</textarea><p class="greeting-message-count${draft.message.length >= RELAY_MESSAGE_MAX ? " is-full" : ""}" id="relay-message-count">${draft.message.length} / ${RELAY_MESSAGE_MAX}</p><h3>${text(compose().visibility)}</h3>${choiceButtons("sender_visibility", identityChoices)}<p class="greeting-translation-note">${text(compose().translationNote)}</p><div class="relay-actions"><button class="secondary-button" data-relay-action="back-read">${text(c().original)}</button><button class="primary-button" data-relay-action="preview">${text(compose().preview)} <span aria-hidden="true">→</span></button></div></section>`
      : `<section class="relay-reply relay-preview"><h2>${text(compose().previewTitle)}</h2><article class="relay-letter"><span>${text(c().original)} · ${text(languageLabel(interfaceLanguageCode))}</span><p>${text(draft.message)}</p></article><dl><div><dt>${text(compose().visibility)}</dt><dd>${text(identityChoices.find(([value]) => value === draft.sender_visibility)?.[1] || "")}</dd></div><div><dt>${text(compose().translation)}</dt><dd>${text(compose().translationNote)}</dd></div></dl><label class="final-check"><input type="checkbox" data-relay-preview-confirmed ${draft.confirmed ? "checked" : ""} /><span>${text(compose().confirm)}</span></label><div class="relay-actions"><button class="secondary-button" data-relay-action="back-write">${text(compose().back)}</button><button class="primary-button" data-relay-action="reply" ${draft.confirmed ? "" : "disabled"}>${text(next.send)} <span aria-hidden="true">→</span></button></div></section>`;
  const firstMessage = messages[0] || null;
  const laterMessages = messages.slice(1);
  const receivedGreeting = firstMessage
    ? `<section class="relay-messages relay-received-message">${messageBlock(firstMessage)}</section>${senderContextSection(thread)}${arrivalReasonSection(thread, firstMessage)}`
    : "";
  const laterThread = laterMessages.length
    ? `<section class="relay-messages relay-later-messages">${laterMessages.map((message) => messageBlock(message)).join("")}</section>`
    : "";
  // 프로젝트 시드와 연구팀 전달문에 「사람이 남긴 문장」 머리말을 달지 않는다 —
  // 발신자 맥락 라벨과 머리말이 서로 모순되지 않게 한다.
  const reasonMeta = thread.connection_reason || {};
  const isSeedGreeting = reasonMeta.sender_context_code === "PROJECT_SEED" || reasonMeta.summary_key === "PROJECT_FIRST_GREETING";
  // 시드·연구팀 머리말은 편지함 사전(task10a4Receipt)에 있다. simplified(안부 단순화 사전)에는
  // 그 키가 없어 빈 문장이 나왔다 — 심사가 잡아낸 버그.
  const receivedHelpText = isSeedGreeting ? task10a4Receipt().receivedHelpSeed : firstMessage?.sender_kind === "researcher" ? task10a4Receipt().receivedHelpResearcher : simplified.receivedHelp;
  const receivedHeading = firstMessage
    ? `<h1>${text(simplified.receivedTitle)}</h1><p class="relay-lead">${text(receivedHelpText)}</p>`
    : `<h1>${text(simplified.featureName)}</h1>`;
  root.innerHTML = `<main class="relay-layout"><section class="relay-card ${firstMessage ? "relay-card-received greeting-arrival" : ""}"><div class="archive-label">${text(simplified.projectLabel)}</div>${receivedHeading}${receivedGreeting}${laterThread}${thread.can_reply ? composeFlow : ""}</section></main>`;
  ensureMessageTranslations();
}
async function request(payload) {
  if (!endpoint || !token) throw new Error("RELAY_NOT_CONFIGURED");
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, token }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) throw new Error(body.error_code || "RELAY_REQUEST_FAILED");
  return body;
}

document.addEventListener("click", async (event) => {
  const retryTranslation = event.target.closest("[data-relay-retry-translation]");
  if (retryTranslation) { ensureMessageTranslations({ retryId: retryTranslation.dataset.relayRetryTranslation }); return; }
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
  // 다시 그리면 글 쓰던 자리를 잃는다. 숫자만 갈아 끼운다.
  const counter = document.getElementById("relay-message-count");
  if (counter) {
    counter.textContent = `${event.target.value.length} / ${RELAY_MESSAGE_MAX}`;
    counter.classList.toggle("is-full", event.target.value.length >= RELAY_MESSAGE_MAX);
  }
});

document.addEventListener("change", (event) => {
  if (!event.target.matches("[data-relay-preview-confirmed]")) return;
  state.draft.confirmed = event.target.checked;
  const button = document.querySelector("[data-relay-action='reply']");
  if (button) button.disabled = !state.draft.confirmed;
});

if (!token || !endpoint) { state.loading = false; state.error = "RELAY_NOT_CONFIGURED"; render(); }
else request({ action: "view" }).then((relay) => { state.relay = relay; state.loading = false; render(); }).catch(() => { state.loading = false; state.error = "RELAY_ACCESS_DENIED"; render(); });
