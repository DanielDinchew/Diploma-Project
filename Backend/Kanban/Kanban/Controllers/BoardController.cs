using Kanban.Data;
using Kanban.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Security.Claims;

namespace Kanban.Controllers
{
    [Route("api/board")]
    [ApiController]
    [Authorize]
    public class BoardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BoardController> _logger;

        public BoardController(ApplicationDbContext context, ILogger<BoardController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("GetUserBoard")]
        public async Task<IActionResult> GetUserBoard()
        {
            try
            {
                var userId = GetCurrentUserId(); // Assumes you have a method to correctly identify the current user's ID.

                // Attempt to find an existing board for the user.
                var board = await _context.Boards
                                          .Include(b => b.Columns)
                                            .ThenInclude(c => c.Tasks)
                                          .FirstOrDefaultAsync(b => b.UserId == userId);

                // If a board doesn't exist for the user, create a new one.
                if (board == null)
                {
                    var newBoard = new Board
                    {
                        Name = "DefaultBoard",
                        UserId = userId, // Set the user ID for the new board.
                        Columns = new List<Column>() // Optionally initialize with empty columns if needed.
                    };

                    _context.Boards.Add(newBoard);
                    await _context.SaveChangesAsync();

                    board = newBoard;
                }

                // Map the board entity to the BoardDto.
                var boardDto = new BoardDto
                {
                    Id = board.Id,
                    Name = board.Name,
                    Columns = board.Columns?.Select(column => new ColumnDto
                    {
                        Id = column.Id,
                        Name = column.Name,
                        Tasks = column.Tasks?.Select(task => new TaskDto
                        {
                            Id = task.Id,
                            description = task.description,
                            ColumnId = column.Id,
                        }).ToList() ?? new List<TaskDto>()
                    }).ToList() ?? new List<ColumnDto>()
                };

                _logger.LogInformation($"Board Data: {JsonConvert.SerializeObject(boardDto)}"); // Logging the DTO now

                // Return the DTO instead of the entity
                return Ok(boardDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching or creating the user's board.");
                return StatusCode(500, "An internal server error has occurred.");
            }
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = HttpContext.User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            throw new Exception("User ID claim not found or is not an integer.");
        }



        [HttpPost("AddColumn")]
        public async Task<IActionResult> AddColumn([FromBody] ColumnCreateDto columnDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState); // Provides detailed error information
            }

            var column = new Column
            {
                Name = columnDto.Name,
                BoardId = columnDto.BoardId
            };
            _context.Columns.Add(column);
            await _context.SaveChangesAsync();
            return Ok(column);
        }

        [HttpPut("UpdateNameColumn")]
        public async Task<IActionResult> UpdateColumnName(int columnId, [FromBody] ColumnUpdateDto columnDto)
        {
            var column = await _context.Columns.FindAsync(columnId);
            if (column == null) return NotFound();

            column.Name = columnDto.Name;
            await _context.SaveChangesAsync();
            return Ok(column);
        }

        [HttpDelete("DeleteColumn/{columnId}")]
        public async Task<IActionResult> DeleteColumn(int columnId)
        {
            var column = await _context.Columns.Include(c => c.Tasks).FirstOrDefaultAsync(c => c.Id == columnId);
            if (column == null) return NotFound();

            _context.Tasks.RemoveRange(column.Tasks); // Remove all tasks within the column
            _context.Columns.Remove(column);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("AddTask")]
        public async Task<IActionResult> AddTask([FromBody] TaskCreateDto taskDto)
        {
            var task = new Models.Task
            {
                description = taskDto.description,
                ColumnId = taskDto.ColumnId
            };
            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();
            return Ok(task);
        }

        [HttpPut("UpdateTask/{taskId}")]
        public async Task<IActionResult> UpdateTask(int taskId, [FromBody] TaskUpdateDto taskDto)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null) return NotFound();
             if (taskDto.description != null) {
                task.description = taskDto.description;
            }
             if (taskDto.ColumnId != null) {
                task.ColumnId = (int)taskDto.ColumnId;
            }
            Console.WriteLine(taskDto.ColumnId);
            await _context.SaveChangesAsync();
            return Ok(task);
        }

        [HttpDelete("DeleteTask/{taskId}")]
        public async Task<IActionResult> DeleteTask(int taskId)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null) return NotFound();

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            return NoContent(); // Or return Ok() if you prefer
        }
    }
}