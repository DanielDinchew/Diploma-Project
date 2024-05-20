namespace Kanban.Models
{
    public class TaskDto
    {
        public int Id { get; set; }
        public string description { get; set; }
        public int ColumnId { get; set; }

    }
}