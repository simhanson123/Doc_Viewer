import type { DocumentModel, ThemeTokens } from '@/types';

type Props = {
  doc: DocumentModel;
  page: number;
  marks: number[];
  theme: ThemeTokens;
  accent: string;
  onGo: (p: number) => void;
};

export function ThumbStrip({ doc, page, marks, theme, accent, onGo }: Props) {
  return (
    <div className="thumb-strip" style={{ background: theme.chrome, borderColor: theme.chromeBorder }}>
      {doc.pages.map((_, i) => {
        const active = i === page;
        const marked = marks.includes(i);
        return (
          <button
            key={i}
            type="button"
            className={`thumb${active ? ' active' : ''}`}
            style={{
              borderColor: active ? accent : theme.rule,
              background: theme.paper,
              color: theme.ink,
            }}
            onClick={() => onGo(i)}
            title={`${i + 1}쪽`}
          >
            <span>{i + 1}</span>
            {marked && <i className="thumb-mark" style={{ background: accent }} />}
          </button>
        );
      })}
    </div>
  );
}
