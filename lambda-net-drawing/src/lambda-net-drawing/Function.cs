using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Drawing;

using Amazon.Lambda.Core;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.LambdaJsonSerializer))]

namespace lambda_net_drawing
{
    public class Function
    {

        /// <summary>
        /// A simple function that takes a string and does a ToUpper
        /// </summary>
        /// <param name="input"></param>
        /// <param name="context"></param>
        /// <returns></returns>
        public string FunctionHandler(string input, ILambdaContext context)
        {
            Image image = new Bitmap(2000, 1024);

            Graphics graph = Graphics.FromImage(image);

            graph.Clear(Color.Azure);

            Pen pen = new Pen(Brushes.Black);

            graph.DrawLines(pen, new Point[] { new Point(10, 10), new Point(800, 900) });

            graph.DrawString("Hello drawing from .NET Core :)",
            new Font(new FontFamily("DecoType Thuluth"), 20, FontStyle.Bold),
            Brushes.Blue, new PointF(150, 90));

            image.Save("graph.jpeg", System.Drawing.Imaging.ImageFormat.Png);
            return input?.ToUpper();
        }
    }
}
