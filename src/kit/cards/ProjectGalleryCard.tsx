/**
 * Compact image-on-top project card.
 * Generalised from SpacePortfolio's ProjectCard.
 *
 * Rounded card with full-bleed image, title and description below.
 */
export type ProjectGalleryCardProps = {
  src: string;
  title: string;
  description: string;
  href?: string;
  className?: string;
};

export function ProjectGalleryCard({
  src,
  title,
  description,
  href,
  className = "",
}: ProjectGalleryCardProps) {
  const Tag: React.ElementType = href ? "a" : "div";
  return (
    <Tag
      href={href}
      target={href ? "_blank" : undefined}
      rel={href ? "noreferrer" : undefined}
      className={`relative block overflow-hidden rounded-lg border border-purple-700/40 shadow-lg ${className}`}
    >
      { }
      <img
        src={src}
        alt={title}
        width={1000}
        height={1000}
        className="w-full object-contain"
      />
      <div className="relative p-4">
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
        <p className="mt-2 text-gray-300">{description}</p>
      </div>
    </Tag>
  );
}
