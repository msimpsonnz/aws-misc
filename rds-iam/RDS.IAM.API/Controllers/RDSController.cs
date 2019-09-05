using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using MySqlConnector;

namespace RDS.IAM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RDSController : ControllerBase
    {
        // GET api/values
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Employees>>> Get()
        {
            var host = "rd14a7bofg5dr7b.c0dngne2r7ev.ap-southeast-2.rds.amazonaws.com";
            var port = 3306;
            var user = "rds_admin";

            var token = GenerateRDSAuth.GenerateRDSToken(host, port, user);

            // var builder = new MySqlConnectionStringBuilder();
            // builder.Server = host;
            // builder.Database = "employees";
            // builder.UserID = user;
            // builder.Password = token;
            // builder.SslCa = "rds-combined-ca-bundle.pem";
            // builder.SslMode = MySqlSslMode.Required;

            List<Employees> list = new List<Employees>();
var connString = "Server=myserver;User ID=mylogin;Password=mypass;Database=mydatabase";

using (var conn = new MySqlConnection(connString))
{
    await conn.OpenAsync();

    // Insert some data
    using (var cmd = new MySqlCommand())
    {
        cmd.Connection = conn;
        cmd.CommandText = "INSERT INTO data (some_field) VALUES (@p)";
        cmd.Parameters.AddWithValue("p", "Hello world");
        await cmd.ExecuteNonQueryAsync();
    }

    // Retrieve all rows
    using (var cmd = new MySqlCommand("SELECT some_field FROM data", conn))
    using (var reader = await cmd.ExecuteReaderAsync())
        while (await reader.ReadAsync())
            Console.WriteLine(reader.GetString(0));
}

            return list;


        }

    }
}
