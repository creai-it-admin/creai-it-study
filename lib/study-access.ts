export type StudyViewer={id:string;roles?:readonly string[]};
export function studyAccessWhere(user:StudyViewer){
 return user.roles?.includes('admin')?{}:{members:{some:{userId:user.id}}};
}
export function sessionVisibilityWhere(user:Pick<StudyViewer,'roles'>){
 return user.roles?.includes('admin')?{}:{weekNo:{gt:0}};
}
export function sessionAccessWhere(user:StudyViewer){
 return {...sessionVisibilityWhere(user),...(user.roles?.includes('admin')?{}:{study:studyAccessWhere(user)})};
}
