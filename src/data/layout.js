export const dimensions = { width: 40, depth: 22, height: 4, floorHeight: 5 };
export function mapToWorld(u, v, y = 0) {
  return {
    x: (u - 0.5) * dimensions.width,
    y,
    z: (v - 0.5) * dimensions.depth,
  };
}
export function worldToMap(x, z) {
  return { u: x / dimensions.width + 0.5, v: z / dimensions.depth + 0.5 };
}
export function area(
  id,
  name,
  floor,
  category,
  bounds,
  description = "",
  interactionType = "info",
) {
  const [x, y, w, h] = bounds;
  return {
    id,
    name,
    floor,
    category,
    mapBounds: { x, y, w, h },
    position: mapToWorld(x + w / 2, y + h / 2),
    size: { x: w * dimensions.width, y: 1, z: h * dimensions.depth },
    rotation: 0,
    description,
    interactionType,
    quizIds: [],
  };
}
