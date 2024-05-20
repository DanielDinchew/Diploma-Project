export type Id = string | number;

export type Column = {
  columnId: any;
  id: Id;
  name: string;
  tasks: Task[];
};

export type Task = {
  id: Id;
  columnId: Id;
  column: Column;
  description: string;
};