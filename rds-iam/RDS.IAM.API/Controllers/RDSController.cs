using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using MySqlX.XDevAPI;
using MySql.Data.MySqlClient;

namespace RDS.IAM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RDSController : ControllerBase
    {
        // GET api/values
        [HttpGet]
        public ActionResult<IEnumerable<Employees>> Get()
        {
            Console.WriteLine("RDS Get");
            var host = "rd14a7bofg5dr7b.c0dngne2r7ev.ap-southeast-2.rds.amazonaws.com";
            var port = 3306;
            var user = "rds_admin";

            var token = GenerateRDSAuth.GenerateRDSToken(host, port, user);

            var builder = new MySqlXConnectionStringBuilder();
            builder.Server = host;
            builder.Database = "employees";
            builder.UserID = user;
            builder.Password = token;
            builder.SslCa = "rds-combined-ca-bundle.pem";
            builder.SslMode = MySqlSslMode.Required;
            builder.Auth = MySqlAuthenticationMode.PLAIN;

            List<Employees> list = new List<Employees>();

            var mySession = MySQLX.GetSession(builder.ConnectionString);

            var myDb = mySession.GetSchema("test");

            // Use the collection "my_collection"
            var myColl = myDb.GetCollection("my_collection");

            // Specify which document to find with Collection.Find() and
            // fetch it from the database with .Execute()
            var myDocs = myColl.Find("name like :param").Limit(1)
                .Bind("param", "S%").Execute();

            // Print document
            Console.WriteLine(myDocs.FetchOne());

            mySession.Close();

            return list;


        }

    }
}
