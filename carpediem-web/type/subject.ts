export type Subject = {
  id?: string;
  uid: string;
  name: string;
  description?: string;
  createdAt?: any;
};

export type SubjectFile = {
  id?: string;
  uid: string;
  subjectId: string;
  fileName: string;
  fileType: string;
  downloadURL: string;
  storagePath: string;
  createdAt?: any;
};