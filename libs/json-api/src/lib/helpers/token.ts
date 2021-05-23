export function getServiceToken(controller: Function) {
  return `${controller.name}JsonApiService`;
}
