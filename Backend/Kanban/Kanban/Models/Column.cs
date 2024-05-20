namespace Kanban.Models
{
    public class Column
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public List<Task> Tasks { get; set; } = new List<Task>(); 
        public int BoardId { get; set; } 
        public Board Board { get; set; } 
    }
}