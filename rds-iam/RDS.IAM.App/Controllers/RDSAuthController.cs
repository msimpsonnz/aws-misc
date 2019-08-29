using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace RDS.IAM.App.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RDSAuthController : ControllerBase
    {

        private readonly ILogger<RDSAuthController> _logger;

        public RDSAuthController(ILogger<RDSAuthController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        public string Get()
        {
            var host = "rd14a7bofg5dr7b.c0dngne2r7ev.ap-southeast-2.rds.amazonaws.com";
            var port = 3306;
            var user = "rds_admin";

            return GenerateRDSAuth.GenerateRDSToken(host, port, user);
            // var rng = new Random();
            // return Enumerable.Range(1, 5).Select(index => new WeatherForecast
            // {
            //     Date = DateTime.Now.AddDays(index),
            //     TemperatureC = rng.Next(-20, 55),
            //     Summary = Summaries[rng.Next(Summaries.Length)]
            // })
            // .ToArray();
        }

        //         [HttpGet]
        // public IEnumerable<string> Get()
        // {
            // var rng = new Random();
            // return Enumerable.Range(1, 5).Select(index => new WeatherForecast
            // {
            //     Date = DateTime.Now.AddDays(index),
            //     TemperatureC = rng.Next(-20, 55),
            //     Summary = Summaries[rng.Next(Summaries.Length)]
            // })
            // .ToArray();
        //}
    }
}
