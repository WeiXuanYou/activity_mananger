import { registerBlockRenderer } from "./registry";
import { PhotoAlbumViewer } from "../components/PhotoAlbumViewer";

/**
 * Photo album block — responsive grid of uploaded images with a built-in
 * fullscreen lightbox.
 *
 * Data shape:
 *   { photos: { url: string; caption?: string }[], cols?: 2 | 3 | 4 }
 *
 * Grid + lightbox both live in PhotoAlbumViewer (a client component) so
 * we can hold the "which photo is open" state. This renderer just
 * marshals the JSON `data` into typed props.
 *
 * Editing photos is handled separately by PhotoAlbumEditor.
 */
type Photo = { url: string; caption?: string };

registerBlockRenderer({
  type: "photo-album",
  label: "📷 相簿",
  render: (data) => {
    const photos = (Array.isArray(data.photos) ? data.photos : []) as Photo[];
    const cols = Number(data.cols ?? 3);
    return <PhotoAlbumViewer photos={photos} cols={cols} />;
  },
});
