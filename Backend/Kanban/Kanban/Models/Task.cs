namespace Kanban.Models
{
    public class Task
    {
        public int Id { get; set; }
        public string description { get; set; }
        public int ColumnId { get; set; } // Foreign key for Column
        public Column Column { get; set; } // Navigation property
    }
}
