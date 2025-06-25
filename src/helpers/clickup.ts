export const importTask = (task) => ({
  ...task,
  tags: task.tags.filter((tag) => !tag.name.startsWith("meta_type:")),
});

export const exportTask = (task) => {
  const result = { ...task };
  if ("markdown_description" in result) {
    result.markdown_content = result.markdown_description;
    delete result.markdown_description;
  }
  return result;
};
