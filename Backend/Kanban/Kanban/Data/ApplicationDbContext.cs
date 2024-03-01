using Microsoft.EntityFrameworkCore;
using Kanban.Models;

namespace Kanban.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Board> Boards { get; set; }
        public DbSet<Column> Columns { get; set; }
        public DbSet<Models.Task> Tasks { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure one-to-one relationship between User and Board
            modelBuilder.Entity<User>()
                .HasOne(u => u.Board)
                .WithOne(b => b.User)
                .HasForeignKey<Board>(b => b.UserId);

            // Configure one-to-many relationship between Board and Columns
            modelBuilder.Entity<Board>()
                .HasMany(b => b.Columns)
                .WithOne(c => c.Board)
                .HasForeignKey(c => c.BoardId);

            // Configure one-to-many relationship between Column and Tasks
            modelBuilder.Entity<Column>()
                .HasMany(c => c.Tasks)
                .WithOne(t => t.Column)
                .HasForeignKey(t => t.ColumnId);
        }
    }
}
