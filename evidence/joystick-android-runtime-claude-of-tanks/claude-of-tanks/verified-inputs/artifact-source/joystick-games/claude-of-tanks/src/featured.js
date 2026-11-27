const scene = {img: 'field.webp', cap: '冬日湖畔', focal: '50% 50%'};
export const FEATURED_SHOTS = [scene];
export const TRANSITION_SHOTS = FEATURED_SHOTS;
export const FEATURED_IMAGES = [scene.img];
export const nextFeaturedShot = () => scene;
export const randomFeaturedShot = () => scene;
export const featuredShotForMap = () => scene;
