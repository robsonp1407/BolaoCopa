export function slugifyPoolName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildSlugCandidate(name: string, suffix?: string) {
  const baseSlug = slugifyPoolName(name) || "bolao";
  return suffix ? `${baseSlug}-${suffix}` : baseSlug;
}
