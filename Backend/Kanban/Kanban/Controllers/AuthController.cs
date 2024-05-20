using Microsoft.AspNetCore.Mvc;
using Kanban.Data;
using Kanban.Models;
using System.Text.RegularExpressions;
using Kanban.Services;

namespace Kanban.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AuthService _authService;
        private readonly ILogger<AuthController> _logger;


        public AuthController(ApplicationDbContext context, AuthService authService, ILogger<AuthController> logger)
        {
            _context = context;
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterAsync(UserRegistrationDto registrationDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var hasUpperCase = new Regex(@"[A-Z]+");
            var hasLowerCase = new Regex(@"[a-z]+");
            var hasNumber = new Regex(@"\d+");
            var hasSpecialChar = new Regex(@"[\W]+");

            if (!hasUpperCase.IsMatch(registrationDto.Password))
                return BadRequest("Password must contain at least one uppercase letter.");

            if (!hasLowerCase.IsMatch(registrationDto.Password))
                return BadRequest("Password must contain at least one lowercase letter.");

            if (!hasNumber.IsMatch(registrationDto.Password))
                return BadRequest("Password must contain at least one number.");

            if (!hasSpecialChar.IsMatch(registrationDto.Password))
                return BadRequest("Password must contain at least one special character.");

            var userExists = _context.Users.Any(u => u.Email == registrationDto.Email);
            if (userExists)
            {
                return BadRequest("User already exists.");
            }

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(registrationDto.Password);
            var user = new User
            {
                Email = registrationDto.Email,
                HashPassword = hashedPassword,
                Name = registrationDto.Name,
                RefreshToken = ""
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                User = new { user.Id, user.Name, user.Email }
            });
        }



        [HttpPost("login")]
        public IActionResult Login(UserLoginDto loginDto)
        {
            var user = _context.Users.FirstOrDefault(u => u.Email == loginDto.Email);
            if (user == null)
            {
                return Unauthorized("This email isn't registered.");
            }

            bool verified = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.HashPassword);
            if (!verified)
            {
                return Unauthorized("Wrong password.");
            }

            var tokens = _authService.RenewTokens(user.Name, user.Id.ToString(), user);
            return Ok(new { AccessToken = tokens.AccessToken, RefreshToken = tokens.RefreshToken });
        }

        [HttpPost("refresh-token")]
        public IActionResult RefreshToken([FromBody] RefreshTokenDto request)
        {
            var user = _context.Users.SingleOrDefault(u => u.RefreshToken == request.RefreshToken);

            if (user == null)
            {
                return Unauthorized("Invalid refresh token.");
            }

            if (user.RefreshTokenExpiryTime <= DateTime.Now)
            {
                return Unauthorized("Invalid refresh token.");
            }

            var tokens = _authService.RenewTokens(user.Name, user.Id.ToString(), user);
            return Ok(new { AccessToken = tokens.AccessToken, RefreshToken = tokens.RefreshToken });
        }


    }
}