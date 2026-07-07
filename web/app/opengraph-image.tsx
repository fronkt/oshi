import { ImageResponse } from "next/og";

// The share card Discord/iMessage renders — for a waitlist seeded in Discords,
// the highest-traffic visual in the funnel. Owned pixels only (ink, rose,
// wordmark, headline): no third-party art in an image we distribute ourselves.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Oshi — anime is better with your people.";

// fetched without a browser UA, Google Fonts serves raw TTF (what satori needs);
// &text= subsets the file to just the glyphs on the card
async function loadGoogleFont(family: string, text: string, weight: number) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!match) throw new Error(`could not resolve ${family}`);
  const res = await fetch(match[1]);
  return res.arrayBuffer();
}

export default async function OpengraphImage() {
  const latin = "Anime is better with your people. oshi — the social layer for anime · early access";
  const [bricolage, notoJp] = await Promise.all([
    loadGoogleFont("Bricolage Grotesque", latin, 700),
    loadGoogleFont("Noto Sans JP", "推", 700),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#0b0b12",
          backgroundImage:
            "radial-gradient(820px 560px at 88% 96%, rgba(255,46,116,0.42), rgba(255,46,116,0.10) 55%, transparent 75%), radial-gradient(560px 420px at 4% -10%, rgba(255,46,116,0.14), transparent 70%)",
          fontFamily: "Bricolage",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            margin: 40,
            padding: 56,
            borderRadius: 28,
            border: "1px solid rgba(255,46,116,0.28)",
          }}
        >
          {/* wordmark row */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: "#ff2e74",
                color: "#0b0b12",
                fontFamily: "NotoJP",
                fontSize: 36,
                fontWeight: 700,
              }}
            >
              推
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, color: "#f4f4f9" }}>Oshi</div>
          </div>

          {/* headline */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 92, fontWeight: 700, color: "#f4f4f9", lineHeight: 1.05, letterSpacing: -3 }}>
              Anime is better
            </div>
            <div style={{ fontSize: 92, fontWeight: 700, color: "#ff2e74", lineHeight: 1.05, letterSpacing: -3 }}>
              with your people.
            </div>
          </div>

          {/* strap */}
          <div style={{ display: "flex", fontSize: 26, color: "#9c9cb4" }}>
            oshi — the social layer for anime · early access
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage", data: bricolage, weight: 700 as const, style: "normal" as const },
        { name: "NotoJP", data: notoJp, weight: 700 as const, style: "normal" as const },
      ],
    },
  );
}
