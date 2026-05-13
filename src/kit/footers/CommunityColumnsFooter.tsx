/**
 * Multi-column community / social / about footer.
 * Generalised from SpacePortfolio's Footer.
 *
 * Three or more bordered link columns + copyright line.
 */
import type { ReactNode } from "react";

export type FooterColumn = {
  title: string;
  links: Array<{
    icon?: ReactNode;
    label: string;
    href?: string;
  }>;
};

export type CommunityColumnsFooterProps = {
  columns: FooterColumn[];
  copyright: string;
  className?: string;
};

export function CommunityColumnsFooter({
  columns,
  copyright,
  className = "",
}: CommunityColumnsFooterProps) {
  return (
    <footer
      className={`h-full w-full bg-transparent p-4 text-gray-200 shadow-lg ${className}`}
    >
      <div className="m-auto flex w-full flex-col items-center justify-center">
        <div className="flex h-full w-full flex-row flex-wrap items-center justify-around">
          {columns.map((col) => (
            <div
              key={col.title}
              className="flex h-auto min-w-[200px] flex-col items-center justify-start"
            >
              <div className="text-[16px] font-bold">{col.title}</div>
              {col.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href ?? "#"}
                  className="my-4 flex cursor-pointer flex-row items-center"
                >
                  {link.icon ? <span className="mr-2">{link.icon}</span> : null}
                  <span className="text-[15px]">{link.label}</span>
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-5 text-center text-[15px]">{copyright}</div>
      </div>
    </footer>
  );
}
