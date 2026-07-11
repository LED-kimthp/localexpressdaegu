const tx = (ko, en, ja, zh) => ({ ko, en, ja, zh });

const languages = [
  ["ko", "한국어"],
  ["en", "EN"],
  ["ja", "日本語"],
  ["zh", "繁體中文"],
];

const copy = {
  startTitle: tx("누가 이 작가를 기억하는가.", "Who remembers this artist?", "この作家を覚えているのは誰か。", "誰還記得這位藝術家？"),
  projectTitle: tx("〈만 39세 이상〉", "Over 39", "〈39歳以上〉", "〈39歲以上〉"),
  projectDescription: tx(
    "대구 시각예술 기억 수집과 창작 지속 조건 인식조사",
    "A survey on visual-art memories and conditions for sustaining practice in Daegu",
    "大邱の視覚芸術の記憶と創作継続の条件に関する調査",
    "大邱視覺藝術記憶與創作持續條件調查",
  ),
  intro: tx(
    "〈만 39세 이상〉은 대구 미술 현장에서 기억되는 작가와 공간, 전시와 장면을 함께 기록하고, 작가가 신진 이후에도 창작을 이어가기 위해 필요한 조건을 묻는 리서치입니다.",
    "Over 39 records artists, spaces, exhibitions, and scenes remembered in Daegu while asking what artists need to sustain their practice beyond the emerging stage.",
    "〈39歳以上〉は、大邱の美術現場で記憶される作家、空間、展覧会、場面を記録し、若手以後も創作を続けるために必要な条件を問うリサーチです。",
    "〈39歲以上〉記錄大邱藝術現場中被記得的藝術家、空間、展覽與場景，並詢問藝術家離開新銳階段後持續創作所需的條件。",
  ),
  note: tx(
    "이름이나 연도가 정확하지 않아도 괜찮습니다. 당신에게 남아 있는 한 장면에서 시작합니다.",
    "Names and dates do not need to be exact. Begin with one scene that remains with you.",
    "名前や年代が正確でなくても構いません。心に残る一つの場面から始めてください。",
    "姓名與年份不必完全正確。請從仍留在你心中的一個場景開始。",
  ),
  introAction: tx("리서치 안내 보기", "Read the research notice", "調査案内を見る", "查看研究說明"),
  resume: tx("작성 이어가기", "Continue draft", "下書きを続ける", "繼續填寫"),
  newResponse: tx("새로 시작", "Start new", "新しく始める", "重新開始"),
  noticeEyebrow: tx("응답 전 안내", "Before you begin", "回答前のご案内", "填答前說明"),
  noticeTitle: tx(
    "기억은 사라진 이름과 장면을 다시 불러오는 시작입니다.",
    "Memory is a beginning that recalls names and scenes that have faded.",
    "記憶は、消えかけた名前や場面をもう一度呼び戻す始まりです。",
    "記憶是再次喚回逐漸消失的名字與場景的開始。",
  ),
  noticeBody: tx(
    "이 조사는 작가를 평가하거나 전시 참여자를 즉시 선정하는 절차가 아닙니다. 응답은 선택한 공개 범위 안에서 연구, 전시, 출판, 정책자료와 온라인 아카이브의 기초 자료로 정리될 수 있습니다.",
    "This survey does not evaluate artists or immediately select exhibition participants. Within the scope you choose, responses may inform research, exhibitions, publications, policy materials, and an online archive.",
    "この調査は作家を評価したり、展覧会参加者を直ちに選定したりするものではありません。選択した公開範囲内で、研究、展覧会、出版、政策資料、オンラインアーカイブの基礎資料として整理される場合があります。",
    "本調查不評價藝術家，也不是立即遴選展覽參與者的程序。回覆將在你選擇的公開範圍內，作為研究、展覽、出版、政策資料與線上檔案的基礎資料。",
  ),
  startSurvey: tx("확인하고 시작하기", "Confirm and begin", "確認して始める", "確認並開始"),
  next: tx("다음", "Next", "次へ", "下一步"),
  back: tx("이전", "Back", "戻る", "上一步"),
  skip: tx("건너뛰기", "Skip", "スキップ", "略過"),
  submit: tx("기억 맡기기", "Submit memory", "記憶を託す", "提交記憶"),
  saved: tx("이 기기에 임시 저장됨", "Draft saved on this device", "この端末に一時保存済み", "已暫存於此裝置"),
  writeAnswer: tx("답변을 적어주세요", "Write your answer", "回答を入力してください", "請填寫回覆"),
  maxChars: tx("최대 800자", "Up to 800 characters", "最大800文字", "最多800字"),
  completeTitle: tx("공공 기억 기증서", "Public Memory Certificate", "公共記憶寄贈書", "公共記憶捐贈證書"),
  completeBody: tx(
    "당신의 기억이 선택한 범위 안에서 〈만 39세 이상〉 리서치의 일부로 기록되었습니다.",
    "Your memory has been recorded as part of Over 39 within the scope you selected.",
    "あなたの記憶は、選択した範囲内で〈39歳以上〉リサーチの一部として記録されました。",
    "你的記憶已在所選範圍內，記錄為〈39歲以上〉研究的一部分。",
  ),
  localOnly: tx(
    "현재 버전은 응답 파일을 이 기기에서 내려받을 수 있습니다.",
    "In this version, the response file can be downloaded on this device.",
    "現在のバージョンでは、この端末に回答ファイルを保存できます。",
    "目前版本可將回覆檔案下載至此裝置。",
  ),
  sending: tx("응답을 전송하는 중입니다.", "Sending response.", "回答を送信しています。", "正在傳送回覆。"),
  sent: tx("응답이 안전하게 전송되었습니다.", "Response sent successfully.", "回答が送信されました。", "回覆已成功傳送。"),
  failed: tx("전송하지 못했습니다. 파일을 저장하거나 다시 시도해 주세요.", "Delivery failed. Save the file or try again.", "送信できませんでした。ファイルを保存するか再試行してください。", "傳送失敗。請儲存檔案或重試。"),
  retry: tx("전송 다시 시도", "Retry delivery", "再送信", "重新傳送"),
  exportLabel: tx("운영자용 데이터 내보내기", "Data export for operators", "運営者用データ書き出し", "營運者資料匯出"),
  json: tx("JSON 저장", "Save JSON", "JSONを保存", "儲存 JSON"),
  csv: tx("CSV 저장", "Save CSV", "CSVを保存", "儲存 CSV"),
  restart: tx("새 기억 입력", "Add another memory", "新しい記憶を入力", "新增一則記憶"),
};

const creditRows = [
  [tx("주최", "Organizer", "主催", "主辦"), "북성로사진관"],
  [tx("프로젝트", "Project", "プロジェクト", "計畫"), "〈만 39세 이상〉"],
  [tx("공간 협력", "Space partner", "空間協力", "空間協力"), "대안공간 모호주택"],
  [tx("연구 협력", "Research partner", "研究協力", "研究協力"), "Local Express Daegu"],
  [tx("지원", "Supported by", "助成", "支持"), "한국문화예술위원회"],
];

const optionGroups = {
  memory_type: [
    ["artist", tx("한 명의 작가", "An artist", "一人の作家", "一位藝術家")],
    ["space", tx("하나의 공간", "A space", "一つの空間", "一個空間")],
    ["exhibition", tx("하나의 전시", "An exhibition", "一つの展覧会", "一場展覽")],
    ["scene", tx("하나의 장면", "A scene", "一つの場面", "一個場景")],
    ["sentence", tx("남아 있는 문장", "A remembered phrase", "残っている言葉", "留下的一句話")],
    ["unnamed_memory", tx("이름 붙이기 어려운 감각", "A feeling hard to name", "名づけにくい感覚", "難以命名的感受")],
  ],
  memory_period: [
    ["recent_5", tx("최근 5년", "Within 5 years", "最近5年", "最近5年")],
    ["5_to_10", tx("5~10년 전", "5–10 years ago", "5〜10年前", "5至10年前")],
    ["10_to_20", tx("10~20년 전", "10–20 years ago", "10〜20年前", "10至20年前")],
    ["over_20", tx("20년 이상", "More than 20 years ago", "20年以上前", "20年以上")],
    ["unknown", tx("잘 모르겠다", "Not sure", "よく分からない", "不確定")],
  ],
  memory_region: [
    ["daegu", tx("대구", "Daegu", "大邱", "大邱")],
    ["gyeongbuk", tx("경북·인접 지역", "Gyeongbuk and nearby", "慶北・近隣地域", "慶北與鄰近地區")],
    ["capital", tx("서울·수도권", "Seoul and capital area", "ソウル・首都圏", "首爾與首都圈")],
    ["other_korea", tx("다른 국내 지역", "Elsewhere in Korea", "韓国の他地域", "韓國其他地區")],
    ["overseas", tx("해외", "Overseas", "海外", "海外")],
    ["unknown", tx("기억나지 않는다", "I do not remember", "覚えていない", "不記得")],
  ],
  memory_elements: [
    ["work", tx("작품", "Work", "作品", "作品")],
    ["attitude", tx("태도", "Attitude", "姿勢", "態度")],
    ["conversation", tx("대화", "Conversation", "会話", "對話")],
    ["space", tx("공간", "Space", "空間", "空間")],
    ["atmosphere", tx("분위기", "Atmosphere", "雰囲気", "氛圍")],
    ["people", tx("함께 있던 사람", "People who were there", "そこにいた人", "當時在場的人")],
    ["material", tx("사진·도록·포스터", "Photos, catalogues, posters", "写真・図録・ポスター", "照片、圖錄、海報")],
    ["sense", tx("설명하기 어려운 감각", "A hard-to-explain feeling", "説明しにくい感覚", "難以說明的感受")],
  ],
  material_evidence: [
    ["photo", tx("작품·전시 사진", "Work or exhibition photos", "作品・展覧会の写真", "作品或展覽照片")],
    ["catalog", tx("도록·리플렛·포스터", "Catalogue, leaflet, or poster", "図録・リーフレット・ポスター", "圖錄、傳單或海報")],
    ["digital", tx("온라인 게시물·링크", "Online post or link", "オンライン投稿・リンク", "線上貼文或連結")],
    ["owned", tx("개인이 보관 중인 자료", "Material kept personally", "個人で保管している資料", "個人保存的資料")],
    ["holder", tx("자료를 가진 사람을 알고 있다", "I know who holds the material", "資料を持つ人を知っている", "知道誰持有資料")],
    ["none", tx("현재 떠오르는 자료가 없다", "No material comes to mind", "今思い浮かぶ資料はない", "目前想不到相關資料")],
  ],
  witness_evidence: [
    ["artist", tx("작가 본인", "The artist", "作家本人", "藝術家本人")],
    ["curator", tx("기획자·비평가", "Curator or critic", "企画者・批評家", "策展人或評論者")],
    ["operator", tx("공간 운영자", "Space operator", "空間運営者", "空間營運者")],
    ["peer", tx("동료 작가", "Peer artist", "同僚作家", "同儕藝術家")],
    ["audience", tx("당시 관객·참여자", "Audience or participant", "当時の観客・参加者", "當時觀眾或參與者")],
    ["unknown", tx("잘 모르겠다", "Not sure", "よく分からない", "不確定")],
  ],
  sensory_evidence: [
    ["place", tx("장소", "Place", "場所", "地點")],
    ["time", tx("시기·계절", "Period or season", "時期・季節", "時期或季節")],
    ["light", tx("빛·색", "Light or color", "光・色", "光線或顏色")],
    ["sound", tx("소리·목소리", "Sound or voice", "音・声", "聲音或嗓音")],
    ["material", tx("재료·표면", "Material or surface", "素材・表面", "材料或表面")],
    ["body", tx("몸의 감각", "Bodily sensation", "身体感覚", "身體感受")],
    ["phrase", tx("문장·대화", "Phrase or conversation", "言葉・会話", "話語或對話")],
  ],
  record_evidence: [
    ["photo", tx("사진", "Photo", "写真", "照片")],
    ["catalog", tx("도록·인쇄물", "Catalogue or print", "図録・印刷物", "圖錄或印刷品")],
    ["article", tx("기사·비평문", "Article or criticism", "記事・批評文", "文章或評論")],
    ["digital", tx("SNS·온라인 링크", "Social media or online link", "SNS・オンラインリンク", "社群媒體或線上連結")],
    ["video", tx("영상·음성", "Video or audio", "映像・音声", "影像或聲音")],
    ["person", tx("함께 확인할 사람", "A person who can verify it", "一緒に確認できる人", "可共同確認的人")],
    ["none", tx("아직 찾지 못했다", "Not found yet", "まだ見つけていない", "尚未找到")],
  ],
  continuity_conditions: [
    ["income", tx("생계·소득", "Income", "生計・収入", "生計與收入")],
    ["studio", tx("작업공간", "Studio space", "制作場所", "工作空間")],
    ["exhibition", tx("전시 기회", "Exhibition opportunities", "展覧会の機会", "展覽機會")],
    ["production", tx("제작비", "Production funding", "制作費", "製作費")],
    ["criticism", tx("비평·기록", "Criticism and documentation", "批評・記録", "評論與記錄")],
    ["network", tx("동료·교류", "Peers and exchange", "仲間・交流", "同儕與交流")],
    ["health", tx("건강·생활 리듬", "Health and daily rhythm", "健康・生活リズム", "健康與生活節奏")],
    ["care", tx("돌봄·가족 책임", "Care and family responsibilities", "ケア・家族責任", "照護與家庭責任")],
    ["local_base", tx("지역 활동 기반", "A local base", "地域での活動基盤", "地方活動基礎")],
  ],
  respondent_role: [
    ["artist", tx("작가", "Artist", "作家", "藝術家")],
    ["curator", tx("기획자·비평가", "Curator or critic", "企画者・批評家", "策展人或評論者")],
    ["space_operator", tx("공간 운영자", "Space operator", "空間運営者", "空間營運者")],
    ["researcher", tx("연구자·교육자", "Researcher or educator", "研究者・教育者", "研究者或教育者")],
    ["audience", tx("관객", "Audience", "観客", "觀眾")],
    ["institution", tx("기관 관계자", "Institutional worker", "機関関係者", "機構工作者")],
    ["other", tx("기타", "Other", "その他", "其他")],
  ],
  age_group_detail: [
    ["20s", tx("20대", "20s", "20代", "20多歲")],
    ["30s", tx("30대", "30s", "30代", "30多歲")],
    ["40s", tx("40대", "40s", "40代", "40多歲")],
    ["50s", tx("50대", "50s", "50代", "50多歲")],
    ["60s_plus", tx("60대 이상", "60 or older", "60代以上", "60歲以上")],
    ["unknown", tx("응답하지 않음", "Prefer not to answer", "回答しない", "不回答")],
  ],
  desired_connection: [
    ["interview", tx("인터뷰", "Interview", "インタビュー", "訪談")],
    ["exhibition", tx("전시", "Exhibition", "展覧会", "展覽")],
    ["publication", tx("출판", "Publication", "出版", "出版")],
    ["criticism", tx("비평·연구", "Criticism or research", "批評・研究", "評論或研究")],
    ["online_archive", tx("온라인 아카이브", "Online archive", "オンラインアーカイブ", "線上檔案")],
    ["roundtable", tx("라운드테이블", "Roundtable", "ラウンドテーブル", "圓桌討論")],
    ["unsure", tx("아직 잘 모르겠다", "Not sure yet", "まだ分からない", "尚未確定")],
  ],
  curated_artist: [
    ["kim_local", tx("김로컬", "Kim Local", "キム・ローカル", "金在地")],
    ["kim_moho", tx("김모호", "Kim Moho", "キム・モホ", "金模糊")],
    ["choi_daegu", tx("최대구", "Choi Daegu", "チェ・テグ", "崔大邱")],
    ["park_bukseong", tx("박북성", "Park Bukseong", "パク・プクソン", "朴北城")],
    ["lee_suchang", tx("이수창", "Lee Suchang", "イ・スチャン", "李壽昌")],
    ["jung_memory", tx("정기억", "Jung Memory", "チョン・キオク", "鄭記憶")],
    ["oh_scene", tx("오장면", "Oh Scene", "オ・チャンミョン", "吳場面")],
    ["yoon_archive", tx("윤아카", "Yoon Archive", "ユン・アーカ", "尹檔案")],
    ["han_continuity", tx("한지속", "Han Continuity", "ハン・チソク", "韓持續")],
    ["seo_exhibition", tx("서전시", "Seo Exhibition", "ソ・チョンシ", "徐展覽")],
    ["bae_practice", tx("배작업", "Bae Practice", "ペ・チャゴプ", "裴創作")],
    ["song_space", tx("송공간", "Song Space", "ソン・コンガン", "宋空間")],
    ["lim_record", tx("임기록", "Lim Record", "イム・キロク", "林記錄")],
    ["jo_scene", tx("조현장", "Jo Field", "チョ・ヒョンジャン", "趙現場")],
    ["moon_connection", tx("문연결", "Moon Connection", "ムン・ヨンギョル", "文連結")],
    ["shin_round", tx("신라운드", "Shin Round", "シン・ラウンド", "申圓桌")],
    ["kang_visual", tx("강시각", "Kang Visual", "カン・シガク", "姜視覺")],
    ["jang_art", tx("장예술", "Jang Art", "チャン・イェスル", "張藝術")],
    ["kwon_peer", tx("권동료", "Kwon Peer", "クォン・トンリョ", "權同儕")],
    ["ryu_recall", tx("류재호명", "Ryu Recall", "リュ・チェホミョン", "柳再呼名")],
    ["not_listed", tx("목록에 떠오르는 작가가 없다", "No artist on this list comes to mind", "このリストには思い浮かぶ作家がいない", "名單中沒有讓我想到的藝術家")],
  ],
  curated_familiarity: [
    ["well_known", tx("이전부터 작업을 알고 있었다", "I already knew their work", "以前から作品を知っていた", "之前就知道其作品")],
    ["name_only", tx("이름만 들어본 적이 있다", "I had heard the name", "名前だけ聞いたことがある", "只聽過名字")],
    ["first_seen", tx("이 목록에서 처음 보았다", "I first saw the name here", "このリストで初めて見た", "第一次在此名單看到")],
    ["curious", tx("잘 모르지만 더 알고 싶다", "I do not know them but want to learn more", "よく知らないが、もっと知りたい", "不熟悉，但想進一步了解")],
  ],
  unlisted_trace_clues: [
    ["place", tx("전시 장소·공간", "Venue or space", "展覧会場・空間", "展覽場地或空間")],
    ["time", tx("대략적인 시기", "Approximate period", "おおよその時期", "大約時期")],
    ["material", tx("재료·매체", "Material or medium", "素材・メディア", "材料或媒材")],
    ["work", tx("작품의 형태", "Form of the work", "作品の形態", "作品形式")],
    ["person", tx("함께 있던 사람", "A person who was there", "一緒にいた人", "當時在場的人")],
    ["image", tx("사진·도록·포스터", "Photo, catalogue, or poster", "写真・図録・ポスター", "照片、圖錄或海報")],
    ["phrase", tx("기억나는 문장·대화", "A remembered phrase or conversation", "記憶に残る言葉・会話", "記得的話語或對話")],
  ],
  recommendation_basis: [
    ["direct_viewing", tx("작품이나 전시를 직접 보았다", "I saw the work or exhibition directly", "作品や展覧会を直接見た", "曾親自看過作品或展覽")],
    ["long_observation", tx("오랫동안 활동을 지켜보았다", "I followed the practice over time", "長期間活動を見てきた", "長期關注其創作")],
    ["collaboration", tx("전시·기획·연구를 함께했다", "We worked together on an exhibition, project, or research", "展覧会・企画・研究を共にした", "曾共同參與展覽、策劃或研究")],
    ["personal_relationship", tx("개인적 친분이나 동료 관계가 있다", "I have a personal or peer relationship", "個人的な親交や同僚関係がある", "有私人交情或同儕關係")],
    ["criticism_archive", tx("비평·도록·기록을 통해 알고 있다", "I know the work through criticism or archives", "批評・図録・記録を通じて知っている", "透過評論、圖錄或檔案了解")],
    ["expert_recommendation", tx("다른 전문가의 추천으로 알게 됐다", "I learned through another expert's recommendation", "他の専門家の推薦で知った", "經其他專家推薦得知")],
    ["first_interest", tx("이번 목록에서 처음 관심이 생겼다", "This list prompted my first interest", "このリストで初めて関心を持った", "因這份名單首次產生興趣")],
  ],
  consent_scope: [
    ["internal_research", tx("내부 리서치 자료로 활용", "Internal research use", "内部リサーチでの利用", "用於內部研究")],
    ["anonymous_public", tx("익명 처리 후 전시·출판·온라인 아카이브에 활용", "Anonymous use in exhibitions, publications, and online archives", "匿名化して展覧会・出版・オンラインアーカイブで利用", "匿名用於展覽、出版與線上檔案")],
    ["follow_up_contact", tx("후속 인터뷰 연락 허용", "Allow follow-up contact", "追加インタビューの連絡を許可", "允許後續訪談聯絡")],
    ["confirm_before_public", tx("공개 활용 전 다시 확인", "Confirm with me before public use", "公開利用前に再確認", "公開使用前再次確認")],
  ],
};

const routeFields = {
  artist: ["artist_identity", "artist_reason", "artist_deepening"],
  space: ["space_identity", "space_reason", "space_deepening"],
  exhibition: ["exhibition_identity", "exhibition_reason", "exhibition_deepening"],
  scene: ["scene_identity", "scene_reason", "scene_deepening"],
  sentence: ["sentence_identity", "sentence_reason", "sentence_deepening"],
  unnamed_memory: ["unnamed_identity", "unnamed_reason", "unnamed_deepening"],
};

const questions = [
  {
    id: "memory_type",
    category: "memory",
    kind: "single",
    field: "memory_type",
    text: tx("오늘 가장 먼저 떠오르는 것은 무엇인가요?", "What comes to mind first today?", "今日、最初に思い浮かぶものは何ですか？", "今天最先浮現在你腦海中的是什麼？"),
    description: tx("정확한 이름이 아니어도 괜찮습니다.", "The exact name is not necessary.", "正確な名前でなくても構いません。", "不需要正確的名稱。"),
    options: "memory_type",
    tags: ["memory", "branch"],
  },
  {
    id: "artist_identity",
    category: "artist",
    kind: "text",
    field: "artist_identity",
    routes: ["artist"],
    text: tx("누구를 떠올렸나요?", "Who did you think of?", "誰を思い浮かべましたか？", "你想到了誰？"),
    placeholder: tx("이름이 정확하지 않다면 기억나는 만큼 적어주세요.", "Write as much of the name as you remember.", "正確でなくても、覚えている範囲で書いてください。", "即使不確定，也請寫下你記得的部分。"),
    tags: ["memory", "artist"],
  },
  {
    id: "artist_reason",
    category: "artist",
    kind: "text",
    field: "artist_reason",
    routes: ["artist"],
    text: tx("그 작가를 기억하는 이유는 무엇인가요?", "Why do you remember this artist?", "その作家を覚えている理由は何ですか？", "你為什麼記得這位藝術家？"),
    placeholder: tx("작품, 태도, 대화, 전시 또는 한 장면을 들려주세요.", "Tell us about a work, attitude, conversation, exhibition, or scene.", "作品、姿勢、会話、展覧会、または一つの場面について教えてください。", "請說說作品、態度、對話、展覽或一個場景。"),
    tags: ["memory", "reason"],
  },
  {
    id: "artist_deepening",
    category: "artist",
    kind: "text",
    field: "artist_deepening",
    routes: ["artist"],
    text: tx("지금 그 작가의 작업에서 다시 보고 싶은 것은 무엇인가요?", "What would you like to see again in this artist's work?", "今、その作家の作品でもう一度見たいものは何ですか？", "現在你最想再次看到這位藝術家的什麼？"),
    placeholder: tx("다음 작업, 다시 보고 싶은 작품, 새 전시 또는 더 듣고 싶은 이야기를 적어주세요.", "Write about a next work, an earlier piece, a new exhibition, or a story you want to hear.", "次の作品、もう一度見たい作品、新しい展覧会、もっと聞きたい話を書いてください。", "請寫下期待的新作、想再看的作品、新展覽或想進一步聽到的故事。"),
    tags: ["memory", "artist", "deepening"],
  },
  {
    id: "space_identity",
    category: "space",
    kind: "text",
    field: "space_identity",
    routes: ["space"],
    text: tx("어떤 공간을 떠올렸나요?", "Which space did you think of?", "どの空間を思い浮かべましたか？", "你想到了哪個空間？"),
    placeholder: tx("공간 이름이나 위치, 외관처럼 기억나는 단서를 적어주세요.", "Write the name, location, appearance, or any clue you remember.", "名前、場所、外観など覚えている手がかりを書いてください。", "請寫下名稱、位置、外觀或任何記得的線索。"),
    tags: ["memory", "space"],
  },
  {
    id: "space_reason",
    category: "space",
    kind: "text",
    field: "space_reason",
    routes: ["space"],
    text: tx("그 공간에 남아 있는 기억은 무엇인가요?", "What memory remains from that space?", "その空間に残っている記憶は何ですか？", "那個空間留下了什麼記憶？"),
    placeholder: tx("사람, 전시, 소리, 빛, 분위기 중 떠오르는 것부터 적어주세요.", "Begin with a person, exhibition, sound, light, or atmosphere.", "人、展覧会、音、光、雰囲気から思い浮かぶことを書いてください。", "可從人物、展覽、聲音、光線或氛圍開始。"),
    tags: ["memory", "reason"],
  },
  {
    id: "space_deepening",
    category: "space",
    kind: "text",
    field: "space_deepening",
    routes: ["space"],
    text: tx("그 공간과 함께 다시 호명해야 할 작가나 전시가 있나요?", "Is there an artist or exhibition that should be recalled with this space?", "その空間とともに、もう一度語るべき作家や展覧会はありますか？", "是否有應與這個空間一起被再次提起的藝術家或展覽？"),
    placeholder: tx("이름이 정확하지 않아도 관계와 장면을 적어주세요.", "Names do not need to be exact; describe the connection or scene.", "名前が正確でなくても、関係や場面を書いてください。", "名稱不必完全正確，請描述關係或場景。"),
    tags: ["memory", "space", "deepening"],
  },
  {
    id: "exhibition_identity",
    category: "exhibition",
    kind: "text",
    field: "exhibition_identity",
    routes: ["exhibition"],
    text: tx("어떤 전시를 떠올렸나요?", "Which exhibition did you think of?", "どの展覧会を思い浮かべましたか？", "你想到了哪一場展覽？"),
    placeholder: tx("전시명, 작가, 장소 또는 대략적인 시기를 적어주세요.", "Write the title, artist, venue, or approximate period.", "展覧会名、作家、会場、おおよその時期を書いてください。", "請寫下展名、藝術家、場地或大約時間。"),
    tags: ["memory", "exhibition"],
  },
  {
    id: "exhibition_reason",
    category: "exhibition",
    kind: "text",
    field: "exhibition_reason",
    routes: ["exhibition"],
    text: tx("그 전시는 왜 기억에 남았나요?", "Why did the exhibition stay with you?", "その展覧会が記憶に残った理由は何ですか？", "那場展覽為什麼留在你的記憶中？"),
    placeholder: tx("가장 먼저 떠오르는 작품이나 장면을 들려주세요.", "Tell us about the first work or scene that comes to mind.", "最初に思い浮かぶ作品や場面を教えてください。", "請說說最先想到的作品或場景。"),
    tags: ["memory", "reason"],
  },
  {
    id: "exhibition_deepening",
    category: "exhibition",
    kind: "text",
    field: "exhibition_deepening",
    routes: ["exhibition"],
    text: tx("그 전시가 당시 현장에 남긴 변화나 질문은 무엇이었나요?", "What change or question did that exhibition leave in the scene?", "その展覧会は当時の現場にどんな変化や問いを残しましたか？", "那場展覽在當時的現場留下了什麼改變或問題？"),
    placeholder: tx("이후의 전시, 작가의 작업, 관객의 반응과 연결해 적어도 좋습니다.", "You may connect it to later exhibitions, the artist's work, or audience responses.", "その後の展覧会、作家の活動、観客の反応と結びつけても構いません。", "可以連結後來的展覽、藝術家的創作或觀眾反應。"),
    tags: ["memory", "exhibition", "deepening"],
  },
  {
    id: "scene_identity",
    category: "scene",
    kind: "text",
    field: "scene_identity",
    routes: ["scene"],
    text: tx("그 장면을 한 문장으로 들려주세요.", "Describe the scene in one sentence.", "その場面を一文で教えてください。", "請用一句話描述那個場景。"),
    placeholder: tx("어디에서, 누가, 무엇을 하고 있었는지부터 시작해도 좋습니다.", "You may begin with where, who, and what was happening.", "どこで、誰が、何をしていたかから始めても構いません。", "可以從地點、人物和正在發生的事情開始。"),
    tags: ["memory", "scene"],
  },
  {
    id: "scene_reason",
    category: "scene",
    kind: "text",
    field: "scene_reason",
    routes: ["scene"],
    text: tx("그 장면에서 아직 남아 있는 감각은 무엇인가요?", "What feeling remains from that scene?", "その場面から今も残っている感覚は何ですか？", "那個場景至今留下了什麼感受？"),
    placeholder: tx("색, 소리, 표정, 온도, 분위기처럼 설명해 주세요.", "Describe a color, sound, expression, temperature, or atmosphere.", "色、音、表情、温度、雰囲気などで説明してください。", "可用顏色、聲音、表情、溫度或氛圍描述。"),
    tags: ["memory", "reason"],
  },
  {
    id: "scene_deepening",
    category: "scene",
    kind: "text",
    field: "scene_deepening",
    routes: ["scene"],
    text: tx("그 장면을 가장 잘 기억하고 있을 사람은 누구일까요?", "Who might remember this scene best?", "その場面を最もよく覚えている人は誰でしょうか？", "誰可能最清楚地記得這個場景？"),
    placeholder: tx("작가, 기획자, 공간 운영자, 동료, 관객처럼 역할만 적어도 됩니다.", "A role such as artist, curator, space operator, peer, or audience is enough.", "作家、企画者、空間運営者、仲間、観客など役割だけでも構いません。", "只寫藝術家、策展人、空間營運者、同儕或觀眾等身分也可以。"),
    tags: ["memory", "scene", "witness", "deepening"],
  },
  {
    id: "sentence_identity",
    category: "sentence",
    kind: "text",
    field: "sentence_identity",
    routes: ["sentence"],
    text: tx("어떤 문장이 남아 있나요?", "What phrase remains with you?", "どんな言葉が残っていますか？", "哪一句話留在你心中？"),
    placeholder: tx("정확하지 않아도 좋습니다. 기억나는 표현을 적어주세요.", "It does not need to be exact. Write what you remember.", "正確でなくても構いません。覚えている表現を書いてください。", "不必完全正確，請寫下你記得的說法。"),
    tags: ["memory", "sentence"],
  },
  {
    id: "sentence_reason",
    category: "sentence",
    kind: "text",
    field: "sentence_reason",
    routes: ["sentence"],
    text: tx("그 문장은 어떤 상황에서 들었나요?", "In what situation did you hear it?", "その言葉はどんな状況で聞きましたか？", "你在什麼情況下聽到這句話？"),
    placeholder: tx("말한 사람, 장소, 당시의 분위기를 적어주세요.", "Write about the speaker, place, or atmosphere.", "話した人、場所、その時の雰囲気を書いてください。", "請寫下說話的人、地點或當時的氛圍。"),
    tags: ["memory", "reason"],
  },
  {
    id: "sentence_deepening",
    category: "sentence",
    kind: "text",
    field: "sentence_deepening",
    routes: ["sentence"],
    text: tx("그 문장은 지금의 창작과 미술 현장에 어떤 의미로 남아 있나요?", "What does this phrase mean for artistic practice and the art scene today?", "その言葉は、今の創作や美術現場にどんな意味を残していますか？", "這句話對今天的創作與藝術現場留下了什麼意義？"),
    placeholder: tx("그때와 지금 사이에서 달라진 것 또는 여전히 유효한 것을 적어주세요.", "Write what has changed since then or what still holds true.", "当時から変わったこと、今も有効なことを書いてください。", "請寫下從那時至今改變的事，或仍然成立的部分。"),
    tags: ["memory", "sentence", "deepening"],
  },
  {
    id: "unnamed_identity",
    category: "sensation",
    kind: "text",
    field: "unnamed_identity",
    routes: ["unnamed_memory"],
    text: tx("이름 붙이기 어려운 그 감각을 들려주세요.", "Tell us about the feeling that is hard to name.", "名づけにくいその感覚について教えてください。", "請描述那個難以命名的感受。"),
    placeholder: tx("색, 소리, 몸의 감각, 분위기에서 시작해도 됩니다.", "You may begin with color, sound, bodily sensation, or atmosphere.", "色、音、身体感覚、雰囲気から始めても構いません。", "可以從顏色、聲音、身體感受或氛圍開始。"),
    tags: ["memory", "sensation"],
  },
  {
    id: "unnamed_reason",
    category: "sensation",
    kind: "text",
    field: "unnamed_reason",
    routes: ["unnamed_memory"],
    text: tx("그 감각과 함께 떠오르는 장소나 사람이 있나요?", "Does a place or person come with that feeling?", "その感覚と一緒に思い浮かぶ場所や人はいますか？", "這個感受是否讓你想起某個地方或某個人？"),
    placeholder: tx("흐릿한 단서만 적어도 괜찮습니다.", "A vague clue is enough.", "曖昧な手がかりだけでも構いません。", "只寫下模糊的線索也可以。"),
    tags: ["memory", "reason"],
  },
  {
    id: "unnamed_deepening",
    category: "sensation",
    kind: "text",
    field: "unnamed_deepening",
    routes: ["unnamed_memory"],
    text: tx("이 감각을 다시 찾기 위해 어떤 단서가 더 필요할까요?", "What additional clue could help recover this memory?", "この感覚をもう一度探すために、どんな手がかりが必要でしょうか？", "若要重新找回這個感受，還需要什麼線索？"),
    placeholder: tx("대략적인 연도, 장소, 재료, 빛, 소리, 함께 있던 사람을 적어주세요.", "Write an approximate year, place, material, light, sound, or person who was there.", "おおよその年代、場所、素材、光、音、一緒にいた人を書いてください。", "請寫下大約年份、地點、材料、光線、聲音或當時在場的人。"),
    tags: ["memory", "sensation", "trace", "deepening"],
  },
  {
    id: "memory_period",
    category: "context",
    kind: "single",
    field: "memory_period",
    text: tx("그 기억은 언제쯤의 일인가요?", "Around when did it happen?", "その記憶はいつ頃のことですか？", "這段記憶大約發生在什麼時候？"),
    options: "memory_period",
    tags: ["memory", "time"],
  },
  {
    id: "memory_region",
    category: "context",
    kind: "multi",
    max: 2,
    field: "memory_region",
    text: tx("그 기억은 어느 지역과 연결되어 있나요?", "Which places are connected to this memory?", "その記憶はどの地域とつながっていますか？", "這段記憶與哪些地區有關？"),
    description: tx("최대 2개까지 선택해 주세요.", "Select up to two.", "2つまで選択してください。", "最多選擇2項。"),
    options: "memory_region",
    tags: ["memory", "region"],
  },
  {
    id: "memory_elements",
    category: "memory",
    kind: "multi",
    max: 3,
    field: "memory_elements",
    text: tx("그 기억을 붙잡고 있는 것은 무엇인가요?", "What holds this memory in place?", "その記憶をつなぎ止めているものは何ですか？", "是什麼讓這段記憶留存下來？"),
    description: tx("최대 3개까지 선택해 주세요.", "Select up to three.", "3つまで選択してください。", "最多選擇3項。"),
    options: "memory_elements",
    tags: ["memory", "elements"],
  },
  {
    id: "verification_evidence",
    category: "context",
    kind: "multi",
    max: 3,
    field: "verification_evidence",
    dynamic: "evidence_path",
    text: tx("이 기억을 함께 확인할 수 있는 단서는 무엇인가요?", "What could help verify this memory?", "この記憶を一緒に確認できる手がかりは何ですか？", "哪些線索能協助確認這段記憶？"),
    description: tx("앞선 답변에 따라 확인 가능한 자료나 증언의 방향을 묻습니다. 최대 3개까지 선택해 주세요.", "Based on your earlier answers, this asks about possible records or witnesses. Select up to three.", "これまでの回答に応じて、確認できる資料や証言の方向を尋ねます。3つまで選択してください。", "依據先前回覆，詢問可確認的資料或證言方向。最多選擇3項。"),
    options: "record_evidence",
    tags: ["memory", "evidence", "verification"],
  },
  {
    id: "continuity_conditions",
    category: "continuity",
    kind: "multi",
    max: 3,
    field: "continuity_conditions",
    text: tx("작가가 작업을 계속하기 위해 가장 필요한 조건은 무엇일까요?", "What do artists need most to keep working?", "作家が制作を続けるために最も必要な条件は何でしょうか？", "藝術家要持續創作，最需要哪些條件？"),
    description: tx("최대 3개까지 선택해 주세요.", "Select up to three.", "3つまで選択してください。", "最多選擇3項。"),
    options: "continuity_conditions",
    tags: ["continuity"],
  },
  {
    id: "respondent_role",
    category: "profile",
    kind: "multi",
    max: 2,
    field: "respondent_role",
    text: tx("당신은 어떤 위치에서 이 기억을 말하고 있나요?", "From what position are you sharing this memory?", "あなたはどの立場からこの記憶を語っていますか？", "你從什麼身分分享這段記憶？"),
    description: tx("최대 2개까지 선택해 주세요.", "Select up to two.", "2つまで選択してください。", "最多選擇2項。"),
    options: "respondent_role",
    tags: ["profile"],
  },
  {
    id: "age_group_detail",
    category: "profile",
    kind: "single",
    field: "age_group_detail",
    text: tx("현재 연령대를 선택해 주세요.", "Please select your age range.", "現在の年代を選択してください。", "請選擇你的年齡層。"),
    description: tx("응답하지 않음을 선택할 수 있습니다.", "You may choose not to answer.", "回答しないことも選べます。", "你可以選擇不回答。"),
    options: "age_group_detail",
    tags: ["profile", "generation"],
  },
  {
    id: "desired_connection",
    category: "connection",
    kind: "multi",
    max: 2,
    field: "desired_connection",
    text: tx("이 기억은 어떤 방식으로 이어지면 좋을까요?", "How should this memory continue?", "この記憶はどのようにつながっていくとよいですか？", "你希望這段記憶如何延續？"),
    description: tx("최대 2개까지 선택해 주세요.", "Select up to two.", "2つまで選択してください。", "最多選擇2項。"),
    options: "desired_connection",
    tags: ["connection"],
  },
  {
    id: "curated_artist",
    category: "collective",
    kind: "single",
    field: "curated_artist",
    text: tx("기억을 한 번 더 넓혀볼까요?", "Shall we widen the field of memory once more?", "記憶の範囲をもう一度広げてみませんか？", "要不要再擴大一次記憶的範圍？"),
    description: tx(
      "다음은 포커스 그룹이 제안한 테스트용 가상 작가 목록입니다. 순위나 전시 후보가 아니며, 선택 횟수보다 선택 근거를 함께 분석합니다. 해당 인물이 없다면 목록에 없음을 선택해 주세요.",
      "This is a fictional test list proposed by a focus group. It is neither a ranking nor an exhibition shortlist; the basis for each choice matters more than the count. Choose “not listed” when no one applies.",
      "以下はフォーカスグループが提案したテスト用の架空作家リストです。順位や展覧会候補ではなく、選択数より選択の根拠を分析します。該当者がいない場合は「リストにいない」を選んでください。",
      "以下是焦點小組提出的測試用虛構藝術家名單，並非排名或展覽候選名單；分析時重視選擇依據，而非票數。若無合適人選，請選擇「名單中沒有」。",
    ),
    options: "curated_artist",
    tags: ["collective_memory", "curated_recall"],
  },
  {
    id: "curated_familiarity",
    disabled: true,
    category: "collective",
    kind: "single",
    field: "curated_familiarity",
    when: "curated_listed",
    text: tx("선택한 인물을 이전부터 알고 있었나요?", "Did you already know the person you selected?", "選んだ人物を以前から知っていましたか？", "你之前就知道所選的人嗎？"),
    options: "curated_familiarity",
    tags: ["collective_memory", "recognition"],
  },
  {
    id: "unlisted_artist_name",
    disabled: true,
    category: "collective",
    kind: "text",
    field: "unlisted_artist_name",
    when: "curated_unlisted",
    text: tx("목록 밖에서 다시 호명하고 싶은 작가가 있나요?", "Is there an artist outside the list you would like to recall?", "リスト外で、もう一度語りたい作家はいますか？", "名單之外，是否有你想再次提起的藝術家？"),
    description: tx("이름이 정확하지 않다면 작품이나 장면의 단서만 적어도 됩니다.", "If the name is uncertain, clues about the work or scene are enough.", "名前が正確でなければ、作品や場面の手がかりだけでも構いません。", "若姓名不確定，只寫作品或場景線索也可以。"),
    placeholder: tx("작가 이름 또는 기억나는 단서", "Artist name or a remembered clue", "作家名または記憶に残る手がかり", "藝術家姓名或記得的線索"),
    tags: ["collective_memory", "unlisted_nomination"],
  },
  {
    id: "unlisted_trace_clues",
    disabled: true,
    category: "collective",
    kind: "multi",
    max: 3,
    field: "unlisted_trace_clues",
    when: "curated_unlisted",
    text: tx("그 인물을 다시 찾는 데 도움이 될 단서는 무엇인가요?", "Which clues could help identify this person?", "その人物を再び探す手がかりは何ですか？", "哪些線索能協助再次找到這個人？"),
    description: tx("최대 3개까지 선택해 주세요.", "Select up to three.", "3つまで選択してください。", "最多選擇3項。"),
    options: "unlisted_trace_clues",
    tags: ["collective_memory", "trace"],
  },
  {
    id: "recommendation_basis",
    disabled: true,
    category: "collective",
    kind: "multi",
    max: 2,
    field: "recommendation_basis",
    text: tx("이 선택은 어떤 경험이나 관계에 근거하나요?", "What experience or relationship is this choice based on?", "この選択はどんな経験や関係に基づいていますか？", "這項選擇基於什麼經驗或關係？"),
    description: tx("이 선택의 배경을 이해하기 위한 질문입니다. 해당하는 경험이나 관계를 최대 2개까지 선택해 주세요.", "This question helps us understand the background of your choice. Select up to two relevant experiences or relationships.", "この選択の背景を理解するための質問です。該当する経験や関係を2つまで選択してください。", "這個問題用來理解選擇的背景。請選擇最多2項相關經驗或關係。"),
    options: "recommendation_basis",
    tags: ["collective_memory", "evidence", "reliability"],
  },
  {
    id: "curated_artist_reason",
    disabled: true,
    category: "collective",
    kind: "text",
    field: "curated_artist_reason",
    dynamic: "curated_artist_reason",
    text: tx("이 인물을 다시 보고 싶은 이유는 무엇인가요?", "Why would you like to see this person again?", "この人物をもう一度見たい理由は何ですか？", "你為什麼想再次看到這個人的作品？"),
    description: tx("기억나는 작업, 기대하는 다음 작업, 또는 지금 궁금해진 이유를 적어주세요.", "Write about a remembered work, a hoped-for next work, or why you became curious now.", "覚えている作品、期待する次の作品、今気になった理由を書いてください。", "請寫下記得的作品、期待的新作，或此刻產生好奇的原因。"),
    placeholder: tx("짧은 문장으로 적어도 괜찮습니다.", "A short sentence is enough.", "短い一文でも構いません。", "簡短一句話也可以。"),
    tags: ["collective_memory", "curated_recall", "reason"],
  },
  {
    id: "curated_followup",
    category: "collective",
    kind: "curated_compound",
    field: "curated_followup",
    text: tx("이 선택이 어디에서 비롯되었는지 들려주세요.", "Tell us where this choice comes from.", "この選択がどこから生まれたのか教えてください。", "請告訴我們這項選擇從何而來。"),
    description: tx("선택한 인물과 다시 보고 싶은 이유, 그리고 그 선택의 배경을 함께 기록합니다.", "We record the selected person, why you want to see them again, and the background of the choice.", "選んだ人物、もう一度見たい理由、その選択の背景を記録します。", "我們會記錄所選人物、想再次看到的理由，以及選擇背景。"),
    tags: ["collective_memory", "evidence", "reliability"],
  },
  {
    id: "consent_scope",
    category: "consent",
    kind: "consent",
    field: "consent_scope",
    text: tx("이 기억을 어떤 범위로 맡기시겠습니까?", "Within what scope may this memory be used?", "この記憶をどの範囲で託しますか？", "你願意在什麼範圍內提供這段記憶？"),
    description: tx("한 가지 이상 선택해 주세요. 후속 연락을 허용하면 같은 화면에서 연락처를 입력합니다.", "Select at least one. If you allow follow-up contact, enter your contact information on this screen.", "1つ以上選択してください。追加連絡を許可する場合、この画面で連絡先を入力します。", "請至少選擇一項。若允許後續聯絡，請在同一畫面輸入聯絡方式。"),
    options: "consent_scope",
    tags: ["consent"],
  },
  {
    id: "contact",
    disabled: true,
    category: "consent",
    kind: "text",
    optional: true,
    field: "contact",
    when: "follow_up_contact",
    text: tx("후속 연락을 위한 연락처를 남겨주세요.", "Please leave contact information for follow-up.", "追加連絡のための連絡先を残してください。", "請留下後續聯絡方式。"),
    description: tx("이 항목은 후속 연락에 동의한 경우에만 표시됩니다.", "This appears only when follow-up contact is allowed.", "追加連絡に同意した場合のみ表示されます。", "僅在同意後續聯絡時顯示。"),
    placeholder: tx("이메일 또는 전화번호", "Email or phone number", "メールアドレスまたは電話番号", "電子郵件或電話號碼"),
    tags: ["consent", "contact"],
  },
];

const categoryLabels = {
  memory: tx("기억", "Memory", "記憶", "記憶"),
  artist: tx("작가", "Artist", "作家", "藝術家"),
  space: tx("공간", "Space", "空間", "空間"),
  exhibition: tx("전시", "Exhibition", "展覧会", "展覽"),
  scene: tx("장면", "Scene", "場面", "場景"),
  sentence: tx("문장", "Phrase", "言葉", "話語"),
  sensation: tx("감각", "Sensation", "感覚", "感受"),
  context: tx("맥락", "Context", "文脈", "脈絡"),
  continuity: tx("지속", "Continuity", "継続", "持續"),
  profile: tx("응답자", "About you", "回答者", "填答者"),
  connection: tx("연결", "Connection", "つながり", "連結"),
  collective: tx("공동 기억", "Collective memory", "集合的記憶", "集體記憶"),
  consent: tx("동의", "Consent", "同意", "同意"),
};

const questionVariants = {
  artist_deepening: [
    tx(
      "그 작가가 다시 작업을 이어간다면 무엇을 가장 먼저 보고 싶나요?",
      "If this artist continued working, what would you want to see first?",
      "その作家が再び制作を続けるなら、まず何を見たいですか？",
      "如果這位藝術家繼續創作，你最先想看到什麼？",
    ),
  ],
  space_deepening: [
    tx(
      "그 공간의 기억을 복원한다면 어떤 인물이나 사건부터 찾아야 할까요?",
      "If this space were reconstructed through memory, which person or event should be traced first?",
      "その空間の記憶を復元するなら、どの人物や出来事から探すべきでしょうか？",
      "如果要重建這個空間的記憶，應先追尋哪個人物或事件？",
    ),
  ],
  exhibition_deepening: [
    tx(
      "그 전시를 지금 다시 본다면 무엇을 새롭게 읽고 싶나요?",
      "If you saw that exhibition again today, what would you want to read differently?",
      "その展覧会を今もう一度見るなら、何を新しく読み取りたいですか？",
      "如果今天再次觀看那場展覽，你想重新理解什麼？",
    ),
  ],
  scene_deepening: [
    tx(
      "그 장면을 다른 사람의 기억과 연결하려면 누구에게 물어보고 싶나요?",
      "Whom would you ask to connect this scene with another memory?",
      "その場面を別の人の記憶とつなぐなら、誰に尋ねたいですか？",
      "若要把這個場景與他人的記憶連結，你想詢問誰？",
    ),
  ],
  sentence_deepening: [
    tx(
      "그 문장을 오늘 다시 꺼내야 하는 이유가 있나요?",
      "Why might this phrase need to be brought back today?",
      "その言葉を今日もう一度取り出す必要があるのはなぜですか？",
      "為什麼今天需要再次提起這句話？",
    ),
  ],
  unnamed_deepening: [
    tx(
      "이 감각을 하나의 기록으로 남긴다면 어떤 단서부터 적고 싶나요?",
      "If this feeling became a record, which clue would you write down first?",
      "この感覚を記録として残すなら、どの手がかりから書きたいですか？",
      "如果要把這個感受留下記錄，你會先寫下哪個線索？",
    ),
  ],
};

const TOTAL_QUESTIONS = 15;
const DRAFT_KEY = "over39-public-memory-draft-v5";
const DRAFT_VERSION = 5;

function detectLanguage() {
  const raw = navigator.language.toLowerCase();
  if (raw.startsWith("ko")) return "ko";
  if (raw.startsWith("ja")) return "ja";
  if (raw.startsWith("zh")) return "zh";
  return "en";
}

function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    return draft?.version === DRAFT_VERSION ? draft : null;
  } catch {
    return null;
  }
}

const state = {
  language: detectLanguage(),
  phase: "intro",
  step: 0,
  answers: {},
  response: null,
  draft: loadDraft(),
  submitStatus: "idle",
  variantSeed: crypto.randomUUID(),
};

if (state.draft?.language) state.language = state.draft.language;

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function l(value) {
  return value?.[state.language] ?? value?.ko ?? value?.en ?? "";
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function selectedLabel(group, value, language = state.language) {
  const label = optionGroups[group]?.find(([item]) => item === value)?.[1];
  return label?.[language] ?? label?.ko ?? value ?? "";
}

function selectedLabels(group, value) {
  return asArray(value).map((item) => selectedLabel(group, item));
}

function stableVariantIndex(questionId, count) {
  const source = state.variantSeed + ":" + questionId;
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  return count ? hash % count : 0;
}

function evidenceMode(answers = state.answers) {
  const elements = asArray(answers.memory_elements);
  if (elements.includes("material")) return "material";
  if (elements.some((item) => ["conversation", "people"].includes(item))) return "witness";
  if (elements.some((item) => ["atmosphere", "sense"].includes(item))) return "sensory";
  return "record";
}

function evidenceOptionGroup(answers = state.answers) {
  return {
    material: "material_evidence",
    witness: "witness_evidence",
    sensory: "sensory_evidence",
    record: "record_evidence",
  }[evidenceMode(answers)];
}

function evidenceQuestionText(answers = state.answers) {
  return {
    material: tx("남아 있을 가능성이 있는 자료는 무엇인가요?", "What material may still remain?", "残っている可能性のある資料は何ですか？", "可能仍留存的資料有哪些？"),
    witness: tx("이 기억을 함께 확인해 줄 수 있는 사람은 누구인가요?", "Who could help verify this memory?", "この記憶を一緒に確認できる人は誰ですか？", "誰能協助確認這段記憶？"),
    sensory: tx("이 감각을 다시 찾는 데 가장 중요한 단서는 무엇인가요?", "Which clue matters most for recovering this feeling?", "この感覚を再び探すために最も重要な手がかりは何ですか？", "重新找回這個感受最重要的線索是什麼？"),
    record: tx("이 기억을 확인할 수 있는 기록은 어디에 남아 있을까요?", "Where might a record of this memory remain?", "この記憶を確認できる記録はどこに残っているでしょうか？", "可確認這段記憶的記錄可能留在哪裡？"),
  }[evidenceMode(answers)];
}

function desiredConnectionText(answers = state.answers) {
  const conditions = asArray(answers.continuity_conditions);
  if (conditions.some((item) => ["criticism", "network"].includes(item))) {
    return tx("이 기억이 다시 대화와 기록으로 이어진다면 어떤 방식이 좋을까요?", "How should this memory continue through dialogue and documentation?", "この記憶が再び対話と記録につながるなら、どんな方法がよいですか？", "若這段記憶再次連結到對話與記錄，什麼方式最合適？");
  }
  if (conditions.some((item) => ["exhibition", "production"].includes(item))) {
    return tx("이 기억을 다시 작품과 전시로 만난다면 어떤 방식이 좋을까요?", "How would you like to encounter this memory again through work or exhibition?", "この記憶を作品や展覧会として再び出会うなら、どんな方法がよいですか？", "若再次透過作品或展覽遇見這段記憶，你希望是什麼方式？");
  }
  return tx("이 기억은 어떤 방식으로 이어지면 좋을까요?", "How should this memory continue?", "この記憶はどのようにつながっていくとよいですか？", "你希望這段記憶如何延續？");
}

function questionText(question, answers = state.answers) {
  if (question.dynamic === "evidence_path") return l(evidenceQuestionText(answers));
  if (question.id === "desired_connection") return l(desiredConnectionText(answers));
  const variants = [question.text, ...(questionVariants[question.id] || [])];
  return l(variants[stableVariantIndex(question.id, variants.length)]);
}

function questionOptionGroup(question, answers = state.answers) {
  if (question.dynamic === "evidence_path") return evidenceOptionGroup(answers);
  return question.options;
}

function activeQuestions(answers = state.answers) {
  const route = answers.memory_type;
  return questions.filter((question) => {
    if (question.disabled) return false;
    if (question.routes && !question.routes.includes(route)) return false;
    return true;
  });
}

function currentQuestion() {
  const flow = activeQuestions();
  return flow[Math.min(state.step, flow.length - 1)];
}

function saveDraft() {
  if (state.phase !== "survey") return;
  const draft = {
    version: DRAFT_VERSION,
    language: state.language,
    step: state.step,
    answers: state.answers,
    variantSeed: state.variantSeed,
    saved_at: new Date().toISOString(),
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  state.draft = draft;
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  state.draft = null;
}

function clearInactiveRouteAnswers(route) {
  Object.entries(routeFields).forEach(([routeName, fields]) => {
    if (routeName !== route) fields.forEach((field) => delete state.answers[field]);
  });
}

function clearCuratedBranchAnswers(value) {
  if (value === "not_listed") {
    delete state.answers.curated_familiarity;
  } else {
    delete state.answers.unlisted_artist_name;
    delete state.answers.unlisted_trace_clues;
  }
  delete state.answers.recommendation_basis;
  delete state.answers.curated_artist_reason;
}

function creditBlock() {
  return (
    "<section class='credit-block' aria-label='Credit hierarchy'>" +
    creditRows
      .map(([role, name]) => "<div class='credit-row'><span>" + esc(l(role)) + "</span><strong>" + esc(name) + "</strong></div>")
      .join("") +
    "</section>"
  );
}

function header() {
  return (
    "<header class='topbar' aria-label='Site header'>" +
    "<div class='brand'><span class='brand-mark'>LED</span><span>Local Express Daegu</span></div>" +
    "<div class='topbar-project'><span>PUBLIC MEMORY RESEARCH</span><strong>" +
    esc(l(copy.projectTitle)) +
    "</strong></div>" +
    "<div class='language-switch' aria-label='Language selector'>" +
    languages
      .map(
        ([code, label]) =>
          "<button data-lang='" +
          code +
          "' class='" +
          (code === state.language ? "active" : "") +
          "' aria-pressed='" +
          (code === state.language) +
          "' type='button'>" +
          label +
          "</button>",
      )
      .join("") +
    "</div></header>"
  );
}

function intro() {
  const draftAction = state.draft
    ? "<button class='secondary-button' data-action='resume' type='button'>" + esc(l(copy.resume)) + "</button>"
    : "";
  return (
    "<main class='intro-grid'>" +
    "<section class='intro-main'>" +
    "<div class='archive-label'>PUBLIC MEMORY RESEARCH · 2026 / OVER 39</div>" +
    "<h1 tabindex='-1'>" +
    esc(l(copy.startTitle)) +
    "</h1>" +
    "<div class='project-lockup'><p class='project-title'>" +
    esc(l(copy.projectTitle)) +
    "</p><span>" +
    esc(l(copy.projectDescription)) +
    "</span></div>" +
    "<p class='intro-copy'>" +
    esc(l(copy.intro)) +
    "</p>" +
    "<div class='intro-actions'><button class='primary-button' data-action='notice' type='button'>" +
    esc(l(copy.introAction)) +
    " <span aria-hidden='true'>→</span></button>" +
    draftAction +
    "<span>7–10 MIN · ONE QUESTION AT A TIME</span></div>" +
    "</section>" +
    "<aside class='intro-side'><div class='side-label'><span>ARCHIVE NOTE</span><strong>01</strong></div>" +
    "<p>" +
    esc(l(copy.note)) +
    "</p>" +
    "<div class='certificate-mini' aria-label='Certificate preview'><div><span>record</span><strong>" +
    esc(l(copy.completeTitle)) +
    "</strong></div><div><span>memory id</span><strong>PM-2026-0001</strong></div></div>" +
    creditBlock() +
    "</aside></main>"
  );
}

function notice() {
  const notes = [
    [tx("기억에서 시작", "Begin with memory", "記憶から始める", "從記憶開始"), copy.note],
    [tx("약 7~10분", "About 7–10 minutes", "約7〜10分", "約7至10分鐘"), tx("한 화면에 한 질문이 나타납니다.", "One question appears at a time.", "一画面に一つの質問が表示されます。", "每個畫面顯示一個問題。")],
    [tx("공개 범위 선택", "Choose the public scope", "公開範囲を選択", "選擇公開範圍"), tx("마지막 단계에서 직접 선택합니다.", "You choose it at the final step.", "最後の段階で選択します。", "在最後階段由你選擇。")],
  ];
  return (
    "<main class='notice-layout'>" +
    "<section class='notice-main'>" +
    "<div class='archive-label'>" +
    esc(l(copy.noticeEyebrow)) +
    "</div><h1 tabindex='-1'>" +
    esc(l(copy.noticeTitle)) +
    "</h1><p>" +
    esc(l(copy.noticeBody)) +
    "</p>" +
    "<div class='notice-list'>" +
    notes
      .map(
        ([title, body], index) =>
          "<div><span>0" +
          (index + 1) +
          "</span><strong>" +
          esc(l(title)) +
          "</strong><p>" +
          esc(l(body)) +
          "</p></div>",
      )
      .join("") +
    "</div></section>" +
    "<aside class='notice-side'><div class='panel-title'>" +
    esc(l(copy.noticeEyebrow)) +
    "</div><p class='notice-assurance'>" +
    esc(l(tx("계속 진행해도 바로 제출되지 않습니다. 활용 동의는 마지막에 선택합니다.", "Continuing does not submit anything. You choose consent at the end.", "続けてもすぐには送信されません。利用同意は最後に選択します。", "繼續操作不會立即提交。使用同意將在最後選擇。"))) +
    "</p><button class='primary-button wide-button' data-action='start' type='button'>" +
    esc(l(copy.startSurvey)) +
    " <span aria-hidden='true'>→</span></button></aside></main>"
  );
}

function textField(field, label, placeholder, value, rows = 5) {
  return (
    "<div class='text-field'><label class='text-field-label' for='answer-" +
    field +
    "'>" +
    esc(label) +
    "</label><textarea id='answer-" +
    field +
    "' class='text-input' data-field='" +
    field +
    "' rows='" +
    rows +
    "' maxlength='800' aria-label='" +
    esc(label) +
    "' placeholder='" +
    esc(placeholder || "") +
    "'>" +
    esc(value || "") +
    "</textarea><span class='text-field-meta'>" +
    esc(l(copy.maxChars)) +
    "</span></div>"
  );
}

function choiceList(group, field, kind, max, className = "") {
  const selected = asArray(state.answers[field]);
  const options = optionGroups[group] || [];
  const atMax = kind === "multi" && max && selected.length >= max;
  return (
    "<div class='choice-list " +
    (group === "curated_artist" ? "curated-list " : "") +
    className +
    "'>" +
    options
      .map(([optionValue, label]) => {
        const isSelected = selected.includes(optionValue);
        const blocked = Boolean(atMax && !isSelected);
        return (
          "<button class='choice " +
          (isSelected ? "selected " : "") +
          (blocked ? "blocked" : "") +
          "' data-choice='" +
          optionValue +
          "' data-answer-field='" +
          field +
          "' data-answer-kind='" +
          kind +
          "' data-answer-max='" +
          (max || "") +
          "' aria-pressed='" +
          isSelected +
          "' aria-disabled='" +
          blocked +
          "' type='button'><span aria-hidden='true'>" +
          (isSelected ? "✓" : "") +
          "</span><strong>" +
          esc(l(label)) +
          "</strong></button>"
        );
      })
      .join("") +
    "</div>"
  );
}

function curatedFollowupControl() {
  const isUnlisted = state.answers.curated_artist === "not_listed";
  const selectedName = isUnlisted
    ? state.answers.unlisted_artist_name || l(tx("목록 밖 인물", "Person outside the list", "リスト外の人物", "名單外的人"))
    : selectedLabel("curated_artist", state.answers.curated_artist);
  const identityField = isUnlisted
    ? textField(
        "unlisted_artist_name",
        l(tx("작가 이름 또는 작품·장면의 단서", "Artist name or clues about the work or scene", "作家名または作品・場面の手がかり", "藝術家姓名或作品、場景線索")),
        l(tx("이름이 정확하지 않아도 괜찮습니다.", "The exact name is not necessary.", "正確な名前でなくても構いません。", "姓名不必完全正確。")),
        state.answers.unlisted_artist_name,
        3,
      )
    : "";
  return (
    "<div class='compound-panel'><div class='compound-selected'><span>" +
    esc(l(tx("선택한 인물", "Selected person", "選んだ人物", "所選人物"))) +
    "</span><strong>" +
    esc(selectedName) +
    "</strong></div>" +
    identityField +
    textField(
      "curated_artist_reason",
      isUnlisted
        ? l(tx("이 인물을 다시 호명하고 싶은 이유", "Why this person should be recalled", "この人物をもう一度語りたい理由", "希望再次提起此人的原因"))
        : l(tx("이 인물의 작업을 다시 보고 싶은 이유", "Why you want to see this person's work again", "この人物の作品をもう一度見たい理由", "想再次看到此人作品的原因")),
      l(tx("기억나는 작업이나 지금 궁금해진 이유를 적어주세요.", "Write about a remembered work or why you are curious now.", "記憶に残る作品や今気になった理由を書いてください。", "請寫下記得的作品或此刻好奇的原因。")),
      state.answers.curated_artist_reason,
      4,
    ) +
    "<section class='compound-section'><h3>" +
    esc(l(tx("선택의 배경", "Background of the choice", "選択の背景", "選擇背景"))) +
    "</h3><p>" +
    esc(
      l(
        tx(
          "이 선택의 배경을 이해하기 위한 질문입니다. 해당하는 경험이나 관계를 최대 2개까지 선택해 주세요.",
          "This question helps us understand the background of your choice. Select up to two relevant experiences or relationships.",
          "この選択の背景を理解するための質問です。該当する経験や関係を2つまで選択してください。",
          "這個問題用來理解選擇的背景。請選擇最多2項相關經驗或關係。",
        ),
      ),
    ) +
    "</p>" +
    choiceList("recommendation_basis", "recommendation_basis", "multi", 2, "compact-evidence") +
    "</section></div>"
  );
}

function consentControl() {
  const scopes = asArray(state.answers.consent_scope);
  const contactField = scopes.includes("follow_up_contact")
    ? textField(
        "contact",
        l(tx("후속 연락을 위한 연락처", "Contact information for follow-up", "追加連絡のための連絡先", "後續聯絡方式")),
        l(tx("이메일 또는 전화번호", "Email or phone number", "メールアドレスまたは電話番号", "電子郵件或電話號碼")),
        state.answers.contact,
        2,
      )
    : "";
  return (
    "<div class='compound-panel consent-panel'>" +
    choiceList("consent_scope", "consent_scope", "multi", 0) +
    contactField +
    "</div>"
  );
}

function answerControl(question) {
  const value = state.answers[question.field];
  if (question.kind === "text") {
    return textField(
      question.field,
      l(copy.writeAnswer),
      question.placeholder ? l(question.placeholder) : "",
      value,
    );
  }
  if (question.kind === "curated_compound") return curatedFollowupControl();
  if (question.kind === "consent") return consentControl();
  const group = questionOptionGroup(question);
  return choiceList(group, question.field, question.kind, question.max);
}

function canContinueQuestion(question) {
  if (question.kind === "curated_compound") {
    const needsName = state.answers.curated_artist === "not_listed";
    return (
      (!needsName || Boolean(String(state.answers.unlisted_artist_name || "").trim())) &&
      Boolean(String(state.answers.curated_artist_reason || "").trim()) &&
      asArray(state.answers.recommendation_basis).length > 0
    );
  }
  if (question.kind === "consent") {
    const scopes = asArray(state.answers.consent_scope);
    return scopes.length > 0 && (!scopes.includes("follow_up_contact") || Boolean(String(state.answers.contact || "").trim()));
  }
  const value = state.answers[question.field];
  return question.optional || (Array.isArray(value) ? value.length > 0 : Boolean(String(value || "").trim()));
}

function survey() {
  const flow = activeQuestions();
  const question = currentQuestion();
  const currentValue = state.answers[question.field];
  const canContinue = canContinueQuestion(question);
  const progress = Math.round(((state.step + 1) / TOTAL_QUESTIONS) * 100);
  const route = selectedLabel("memory_type", state.answers.memory_type) || l(tx("경로 선택 전", "Choose a route", "経路選択前", "尚未選擇路徑"));
  return (
    "<main class='interview-layout'>" +
    "<section class='interview-panel' aria-live='polite' aria-labelledby='question-title'>" +
    "<div class='progress-track' role='progressbar' aria-label='Survey progress' aria-valuemin='1' aria-valuemax='" +
    TOTAL_QUESTIONS +
    "' aria-valuenow='" +
    (state.step + 1) +
    "'><span style='width:" +
    progress +
    "%'></span></div>" +
    "<div class='interview-meta'><span>PUBLIC MEMORY INTERVIEW</span><strong>" +
    String(state.step + 1).padStart(2, "0") +
    " / " +
    String(TOTAL_QUESTIONS).padStart(2, "0") +
    "</strong></div>" +
    "<div class='interview-head'><div class='interview-copy'><div class='interview-kicker'>" +
    esc(l(categoryLabels[question.category])) +
    " · " +
    esc(route) +
    "</div><h2 id='question-title' tabindex='-1'>" +
    esc(questionText(question)) +
    "</h2>" +
    (question.description ? "<p>" + esc(l(question.description)) + "</p>" : "") +
    "</div></div>" +
    "<div class='answer-panel'>" +
    answerControl(question) +
    "</div>" +
    "<div class='survey-actions'><button class='secondary-button' " +
    (state.step === 0 ? "disabled " : "") +
    "data-action='back' type='button'><span aria-hidden='true'>←</span> " +
    esc(l(copy.back)) +
    "</button>" +
    (question.optional && !currentValue ? "<button class='secondary-button' data-action='skip' type='button'>" + esc(l(copy.skip)) + "</button>" : "<span></span>") +
    "<button class='primary-button' " +
    (canContinue ? "" : "disabled ") +
    "data-action='next' type='button'>" +
    esc(state.step === flow.length - 1 ? l(copy.submit) : l(copy.next)) +
    " <span aria-hidden='true'>→</span></button></div>" +
    "<div class='draft-status' role='status'><span></span>" +
    esc(l(copy.saved)) +
    "</div></section></main>"
  );
}

function syncNextButton() {
  if (state.phase !== "survey") return;
  const question = currentQuestion();
  const canContinue = canContinueQuestion(question);
  const nextButton = document.querySelector("button.primary-button[data-action='next']");
  if (nextButton) nextButton.disabled = !canContinue;
}

function responseRouteValues(answers) {
  const fields = routeFields[answers.memory_type] || [];
  return {
    memory_name: answers[fields[0]] || "",
    memory_reason: answers[fields[1]] || "",
    memory_deepening: answers[fields[2]] || "",
  };
}

function responseAnswer(question, answers) {
  if (question.kind === "curated_compound") {
    return {
      curated_artist: answers.curated_artist || "",
      unlisted_artist_name: answers.unlisted_artist_name || "",
      reason: answers.curated_artist_reason || "",
      recommendation_basis: asArray(answers.recommendation_basis),
    };
  }
  if (question.kind === "consent") {
    return {
      consent_scope: asArray(answers.consent_scope),
      contact: asArray(answers.consent_scope).includes("follow_up_contact") ? answers.contact || "" : "",
    };
  }
  return answers[question.field];
}

function hasResponseAnswer(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.values(value).some(hasResponseAnswer);
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function createResponse() {
  const answers = state.answers;
  const flow = activeQuestions(answers);
  const consent = asArray(answers.consent_scope);
  const recommendationBasis = asArray(answers.recommendation_basis);
  const routeValues = responseRouteValues(answers);
  const curatedArtistLabel =
    answers.curated_artist === "not_listed"
      ? answers.unlisted_artist_name || selectedLabel("curated_artist", "not_listed", "ko")
      : selectedLabel("curated_artist", answers.curated_artist, "ko");
  const rawAnswers = flow
    .map((question) => ({ question, answer: responseAnswer(question, answers) }))
    .filter(({ answer }) => hasResponseAnswer(answer))
    .map(({ question, answer }) => ({
      question_id: question.id,
      category: question.category,
      field: question.field,
      prompt: questionText(question, answers),
      answer,
      tags: question.tags || [],
    }));
  return {
    response_id: "PM-2026-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
    submitted_at: new Date().toISOString(),
    language: state.language,
    respondent_role: asArray(answers.respondent_role),
    age_group_detail: answers.age_group_detail || "",
    memory_type: answers.memory_type || "",
    branch_type: answers.memory_type || "",
    memory_name: routeValues.memory_name,
    memory_reason: routeValues.memory_reason,
    memory_deepening: routeValues.memory_deepening,
    memory_period: answers.memory_period || "",
    memory_region: asArray(answers.memory_region),
    memory_elements: asArray(answers.memory_elements),
    verification_mode: evidenceMode(answers),
    verification_evidence: asArray(answers.verification_evidence),
    continuity_conditions: asArray(answers.continuity_conditions),
    desired_connection: asArray(answers.desired_connection),
    curated_artist: answers.curated_artist || "",
    curated_artist_label: curatedArtistLabel,
    recall_mode: answers.curated_artist === "not_listed" ? "unlisted_nomination" : "aided_list_recall",
    unlisted_artist_name: answers.unlisted_artist_name || "",
    recommendation_basis: recommendationBasis,
    recommendation_has_direct_evidence: recommendationBasis.some((item) =>
      ["direct_viewing", "long_observation", "criticism_archive"].includes(item),
    ),
    recommendation_personal_tie_disclosed: recommendationBasis.some((item) =>
      ["collaboration", "personal_relationship"].includes(item),
    ),
    curated_artist_reason: answers.curated_artist_reason || "",
    consent_scope: consent,
    consent_internal: consent.includes("internal_research"),
    consent_publication: consent.includes("anonymous_public"),
    consent_contact: consent.includes("follow_up_contact"),
    consent_confirm_before_public: consent.includes("confirm_before_public"),
    contact: consent.includes("follow_up_contact") ? answers.contact || "" : "",
    question_path: rawAnswers.map((item) => item.question_id),
    tags: [...new Set(rawAnswers.flatMap((item) => item.tags))],
    generated_summary: routeValues.memory_name + (routeValues.memory_reason ? " — " + routeValues.memory_reason : ""),
    raw_answers: rawAnswers,
    webhook_ready: {
      source: "over-39-led-public-memory-engine",
      version: "0.6.0-static",
      ai_followup_ready: true,
      suggested_next_action: "Send to Slack, Make.com, Google Sheets, Airtable, or a future AI follow-up workflow.",
    },
  };
}

function toCsv(response) {
  const row = {};
  Object.entries(response).forEach(([key, value]) => {
    if (key === "raw_answers") return;
    row[key] = Array.isArray(value) ? value.join(" / ") : typeof value === "object" && value ? JSON.stringify(value) : String(value ?? "");
  });
  row.raw_answers_json = JSON.stringify(response.raw_answers);
  const headers = Object.keys(row);
  const values = headers.map((header) => '"' + String(row[header] ?? "").replaceAll('"', '""') + '"');
  return headers.join(",") + "\n" + values.join(",") + "\n";
}

function submitMessage() {
  const message =
    state.submitStatus === "sending"
      ? copy.sending
      : state.submitStatus === "sent"
        ? copy.sent
        : state.submitStatus === "failed"
          ? copy.failed
          : copy.localOnly;
  return "<div class='submit-status " + state.submitStatus + "' role='status'>" + esc(l(message)) + "</div>";
}

function complete() {
  const response = state.response;
  const retryButton =
    state.submitStatus === "failed"
      ? "<button class='secondary-button' data-action='retry' type='button'>" + esc(l(copy.retry)) + "</button>"
      : "";
  return (
    "<main class='complete-grid'><section class='memory-card certificate-card'>" +
    "<div class='card-header'><span>" +
    esc(l(copy.completeTitle)) +
    "</span><strong>" +
    esc(response.response_id) +
    "</strong></div>" +
    "<h1 tabindex='-1'>" +
    esc(l(copy.completeTitle)) +
    "</h1><p class='certificate-copy'>" +
    esc(l(copy.completeBody)) +
    "</p>" +
    submitMessage() +
    retryButton +
    "<dl><div><dt>MEMORY ID</dt><dd>" +
    esc(response.response_id) +
    "</dd></div><div><dt>TYPE</dt><dd>" +
    esc(selectedLabel("memory_type", response.memory_type)) +
    "</dd></div><div><dt>MEMORY</dt><dd>" +
    esc(response.memory_name || l(tx("이름 없는 기억", "Unnamed memory", "名前のない記憶", "未命名的記憶"))) +
    "</dd></div><div><dt>EVIDENCE</dt><dd>" +
    esc(selectedLabels(evidenceOptionGroup(response), response.verification_evidence).join(" / ") || "—") +
    "</dd></div><div><dt>CONNECTION</dt><dd>" +
    esc(selectedLabels("desired_connection", response.desired_connection).join(" / ") || "—") +
    "</dd></div><div><dt>RECALLED ARTIST</dt><dd>" +
    esc(response.curated_artist_label || "—") +
    "</dd></div><div><dt>BASIS</dt><dd>" +
    esc(selectedLabels("recommendation_basis", response.recommendation_basis).join(" / ") || "—") +
    "</dd></div><div><dt>WHY NOW</dt><dd>" +
    esc(response.curated_artist_reason || "—") +
    "</dd></div><div><dt>CONSENT</dt><dd>" +
    esc(selectedLabels("consent_scope", response.consent_scope).join(" / ")) +
    "</dd></div></dl>" +
    "<details class='export-panel'><summary>" +
    esc(l(copy.exportLabel)) +
    "</summary><div class='export-actions'><button class='secondary-button' data-action='json' type='button'>" +
    esc(l(copy.json)) +
    "</button><button class='secondary-button' data-action='csv' type='button'>" +
    esc(l(copy.csv)) +
    "</button></div></details>" +
    "<button class='primary-button restart-button' data-action='restart' type='button'>" +
    esc(l(copy.restart)) +
    "</button></section></main>"
  );
}

async function sendWebhook(response) {
  const webhookUrl = window.OVER39_WEBHOOK_URL;
  if (!webhookUrl) return "local";
  try {
    const result = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(response),
      keepalive: true,
    });
    return result.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

function footer() {
  return (
    "<footer class='site-footer'><div class='footer-project'><strong>" +
    esc(l(copy.projectTitle)) +
    "</strong><span>PUBLIC MEMORY RESEARCH · 2026</span></div><div class='footer-credits'>" +
    creditRows
      .map(([role, name]) => "<span><em>" + esc(l(role)) + "</em>" + esc(name) + "</span>")
      .join("") +
    "</div></footer>"
  );
}

function render(focusHeading = false) {
  document.documentElement.lang = state.language === "zh" ? "zh-Hant" : state.language;
  const root = document.querySelector("#root");
  root.innerHTML =
    "<div class='site-shell phase-" +
    state.phase +
    "'>" +
    header() +
    (state.phase === "intro" ? intro() : "") +
    (state.phase === "notice" ? notice() : "") +
    (state.phase === "survey" ? survey() : "") +
    (state.phase === "complete" ? complete() : "") +
    footer() +
    "</div>";
  if (focusHeading) requestAnimationFrame(() => document.querySelector("h1[tabindex='-1'], h2[tabindex='-1']")?.focus());
}

function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  if (target.dataset.lang) {
    state.language = target.dataset.lang;
    saveDraft();
    render();
    return;
  }

  if (target.dataset.action === "notice") {
    state.phase = "notice";
    render(true);
    return;
  }

  if (target.dataset.action === "start") {
    clearDraft();
    state.answers = {};
    state.step = 0;
    state.variantSeed = crypto.randomUUID();
    state.phase = "survey";
    saveDraft();
    render(true);
    return;
  }

  if (target.dataset.action === "resume" && state.draft) {
    state.language = state.draft.language || state.language;
    state.answers = state.draft.answers || {};
    state.step = Math.min(state.draft.step || 0, activeQuestions(state.draft.answers || {}).length - 1);
    state.variantSeed = state.draft.variantSeed || crypto.randomUUID();
    state.phase = "survey";
    render(true);
    return;
  }

  if (target.dataset.action === "back") {
    state.step = Math.max(0, state.step - 1);
    saveDraft();
    render(true);
    return;
  }

  if (target.dataset.choice) {
    if (target.getAttribute("aria-disabled") === "true") return;
    const question = currentQuestion();
    const value = target.dataset.choice;
    const answerField = target.dataset.answerField || question.field;
    const answerKind = target.dataset.answerKind || question.kind;
    const answerMax = Number(target.dataset.answerMax || question.max || 0);
    const current = state.answers[answerField];
    if (answerKind === "multi") {
      const selected = asArray(current);
      if (!selected.includes(value) && answerMax && selected.length >= answerMax) return;
      state.answers[answerField] = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
      if (answerField === "consent_scope" && !state.answers[answerField].includes("follow_up_contact")) delete state.answers.contact;
    } else {
      state.answers[answerField] = value;
      if (answerField === "memory_type") clearInactiveRouteAnswers(value);
      if (answerField === "curated_artist") clearCuratedBranchAnswers(value);
    }
    saveDraft();
    render();
    return;
  }

  if (target.dataset.action === "skip" || target.dataset.action === "next") {
    const flow = activeQuestions();
    if (state.step < flow.length - 1) {
      state.step += 1;
      saveDraft();
      render(true);
      return;
    }
    state.response = createResponse();
    clearDraft();
    state.phase = "complete";
    state.submitStatus = window.OVER39_WEBHOOK_URL ? "sending" : "local";
    render(true);
    if (window.OVER39_WEBHOOK_URL) {
      state.submitStatus = await sendWebhook(state.response);
      render();
    }
    return;
  }

  if (target.dataset.action === "retry" && state.response) {
    state.submitStatus = "sending";
    render();
    state.submitStatus = await sendWebhook(state.response);
    render();
    return;
  }

  if (target.dataset.action === "json") {
    download("over-39-" + state.response.response_id + ".json", JSON.stringify(state.response, null, 2), "application/json");
    return;
  }

  if (target.dataset.action === "csv") {
    download("over-39-" + state.response.response_id + ".csv", toCsv(state.response), "text/csv;charset=utf-8");
    return;
  }

  if (target.dataset.action === "restart") {
    clearDraft();
    state.phase = "intro";
    state.step = 0;
    state.answers = {};
    state.response = null;
    state.submitStatus = "idle";
    render(true);
  }
});

document.addEventListener("input", (event) => {
  if (!event.target.matches("[data-field]")) return;
  state.answers[event.target.dataset.field] = event.target.value;
  saveDraft();
  syncNextButton();
});

render();
