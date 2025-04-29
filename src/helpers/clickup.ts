export const filterTaskTags = (task) => ({
  ...task,
  tags: task.tags.filter((tag) => !tag.name.startsWith("meta_type:")),
});
