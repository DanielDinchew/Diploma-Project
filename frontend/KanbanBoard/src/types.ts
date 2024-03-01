export type Id = string | number;

export type Column = {
  id: Id;
  name: string;
  tasks: Task[];
};

export type Task = {
  id: Id;
  columnId: Id;
  description: string;
};