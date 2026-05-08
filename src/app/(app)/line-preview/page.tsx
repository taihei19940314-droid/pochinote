export default function LinePreviewPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full py-8">
      <div className="text-xs tracking-[0.2em] uppercase mb-6" style={{ color: "var(--ink-soft)" }}>
        飼い主側の体験
      </div>

      {/* Phone mockup */}
      <div className="phone">
        <div className="phone-screen">

          {/* LINE header */}
          <div className="px-4 pt-12 pb-3 flex items-center gap-3 border-b border-black/5" style={{ background: "white" }}>
            <button className="text-lg text-gray-400">‹</button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ background: "var(--terra)" }}>🐾</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">ぽちのて トリミング 渋谷店</div>
              <div className="text-[10px] text-gray-500">タップでホームを表示</div>
            </div>
            <div className="text-base text-gray-400">☰</div>
          </div>

          {/* Chat area */}
          <div className="overflow-y-auto no-scrollbar px-3 py-3 space-y-2.5" style={{ height: "calc(100% - 120px)", background: "#f0f2f5" }}>

            <div className="text-center text-[10px] text-gray-500 my-2">5月3日(日)</div>

            {/* 飼い主から */}
            <div className="flex flex-col items-end">
              <div className="chat-bubble-me">次の予約いつ取れますか?</div>
              <div className="text-[9px] text-gray-400 mt-0.5 mr-1">18:30 既読</div>
            </div>

            {/* 店から: 空き枠オファー */}
            <div className="flex items-end gap-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: "var(--terra)" }}>🐾</div>
              <div className="chat-rich">
                <div className="h-20 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #d97757, #b85d3f)" }}>
                  <div className="text-white text-center">
                    <div className="text-[10px] tracking-[0.2em] uppercase opacity-80 mb-0.5">Limited Offer</div>
                    <div className="font-display text-xl font-semibold italic">20% OFF</div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[12px] font-semibold mb-1">モカちゃん、お久しぶりです🐾</div>
                  <div className="text-[11px] text-gray-600 leading-relaxed mb-2">
                    14:00〜15:30 に空きが出ました。✂️<br />
                    <span className="font-semibold" style={{ color: "var(--terra)" }}>限定 20% OFF</span>、いかがですか?
                  </div>
                  <button className="w-full py-2 rounded-md text-[11px] font-semibold text-white" style={{ background: "var(--line-green)" }}>予約する</button>
                </div>
              </div>
            </div>
            <div className="text-[9px] text-gray-400 ml-9">19:42</div>

            {/* 店から: ビフォーアフター */}
            <div className="flex items-end gap-1.5 mt-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: "var(--terra)" }}>🐾</div>
              <div className="chat-rich">
                <div className="grid grid-cols-2 h-24">
                  <div className="flex items-center justify-center text-3xl text-white/40 relative" style={{ background: "linear-gradient(135deg, #6b8e7f, #4a6b5c)" }}>
                    🐩
                    <div className="absolute bottom-1 left-1 text-[8px] font-mono text-white bg-black/40 px-1 rounded">BEFORE</div>
                  </div>
                  <div className="flex items-center justify-center text-3xl text-white/40 relative" style={{ background: "linear-gradient(135deg, #c89b3c, #a17f2e)" }}>
                    ✨🐩
                    <div className="absolute bottom-1 left-1 text-[8px] font-mono text-white bg-black/40 px-1 rounded">AFTER</div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[12px] font-semibold mb-1">前回のお仕上がりです🐶</div>
                  <div className="text-[10px] text-gray-600">次回は<span className="font-semibold" style={{ color: "var(--terra)" }}>6/1頃</span>がおすすめです。</div>
                </div>
              </div>
            </div>

            {/* 店から: 期間限定価格 */}
            <div className="flex items-end gap-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: "var(--terra)" }}>🐾</div>
              <div className="chat-bubble-them">
                <div className="text-[11px] leading-relaxed">
                  期間限定：本日のみ<br />
                  <span className="font-semibold" style={{ color: "var(--terra)" }}>¥7,800</span>
                  <span className="text-gray-400 line-through ml-1 text-[10px]">通常¥8,800</span>
                  <br />でご案内できます
                </div>
              </div>
            </div>

            {/* 飼い主から */}
            <div className="flex flex-col items-end">
              <div className="chat-bubble-me">行きます!</div>
              <div className="text-[9px] text-gray-400 mt-0.5 mr-1">19:48 既読</div>
            </div>

            {/* 店から: 確認 */}
            <div className="flex items-end gap-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: "var(--terra)" }}>🐾</div>
              <div className="chat-bubble-them">
                <div className="font-semibold text-[12px] mb-1" style={{ color: "var(--terra)" }}>✓ ご予約承りました✨</div>
                <div className="text-[11px] text-gray-600">ありがとうございます！<br />当日お待ちしております🐾</div>
              </div>
            </div>

          </div>

          {/* Input bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2 border-t border-black/5" style={{ background: "white" }}>
            <div className="text-gray-400 text-xl">+</div>
            <div className="flex-1 rounded-full px-4 py-1.5 text-[12px] text-gray-400 border border-gray-200">メッセージを入力</div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm" style={{ background: "var(--line-green)" }}>↑</div>
          </div>

        </div>
      </div>
    </div>
  );
}
