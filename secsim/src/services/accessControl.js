export function canAccess(role, file) {
  return file.minLevel <= role.level;
}

export function buildPayload(mode, role, fileTree) {
  return fileTree.map((group) => ({
    folder: group.folder,
    files: group.files.map((file) => ({
      name: file.name,
      minLevel: file.minLevel,
      content: mode === 'insecure' || file.minLevel <= role.level ? file.content : null,
    })),
  }));
}
