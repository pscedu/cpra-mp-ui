export const calculateDiff = (oldObjs: any[], newObjs: any[], attr: string) => {
  const unpack = (objs: any) => new Set(objs.map((obj: any) => obj[attr]));
  const diff = (a: Set, b: Set) => Array.from(a).filter((item) => !b.has(item));
  const oldSet = unpack(oldObjs);
  const newSet = unpack(newObjs);
  return {
    add: diff(newSet, oldSet),
    rem: diff(oldSet, newSet),
  };
};
