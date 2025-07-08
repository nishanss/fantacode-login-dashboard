using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FantacodeAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration; 

namespace FantacodeAuthAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private static readonly List<User> _users = new List<User>
        {
            new User { Username = "user1", PasswordHash = "password123" }, 
            new User { Username = "admin", PasswordHash = "adminpass" }
        };

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [AllowAnonymous] 
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { Message = "Username and password are required." });
            }

            var user = _users.FirstOrDefault(u => u.Username == request.Username && u.PasswordHash == request.Password);

            if (user == null)
            {
                return Unauthorized(new { Message = "Invalid username or password." });
            }

            var token = GenerateJwtToken(user);

            return Ok(new { Token = token, Message = "Login successful." });
        }

        [Authorize]
        [HttpGet("dashboard")]
        public IActionResult GetDashboardData()
        {
            var username = User.Identity?.Name;
            var chartData = new
            {
                Labels = new[] { "January", "February", "March", "April", "May", "June" },
                Data = new[] { 65, 59, 80, 81, 56, 55 },
                Title = "Monthly Sales Data"
            };

            return Ok(new { Message = $"Welcome to the dashboard, {username}!", ChartData = chartData });
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];
            var expiryMinutes = int.Parse(jwtSettings["ExpiryMinutes"]!);

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Username), 
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()), 
                new Claim(ClaimTypes.Name, user.Username), 
                new Claim(ClaimTypes.Role, user.Role) 
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.Now.AddMinutes(expiryMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
