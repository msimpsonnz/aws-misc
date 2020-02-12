var dotenv = require("dotenv");
dotenv.config();
var AWS = require("aws-sdk");
AWS.config.update({region: 'ap-southeast-2'});
var mediaconvert = new AWS.MediaConvert({apiVersion: '2017-08-29'});

var params = {
    transcoderQueue: process.env.AWS_Queue,
    transcoderRole: process.env.AWS_Role,
    inputS3Path: process.env.AWS_S3InputFile,
    outputVideoS3Path: process.env.AWS_S3OutputFile
}

function transcode(params)
{ 
    getEndpoint();
    submitJob(params);
}

function getEndpoint(){
    var endpointParams = {
        MaxResults: 0,
      };

    var endpointPromise = mediaconvert.describeEndpoints(endpointParams).promise();
      
      
    endpointPromise.then(
      function(data) {
          AWS.config.mediaconvert = {endpoint : data.Endpoints[0].Url};
          mediaconvert.endpoint = data.Endpoints[0].Url;
        console.log(AWS.config.mediaconvert.endpoint);
      },
      function(err) {
        console.log("Error", err);
      }
    );
}

function submitJob(params)
{ 
    var transcodeParams = {
        "Queue": params.transcoderQueue,
        "UserMetadata": {
          "Customer": "Amazon"
        },
        "Role": params.transcoderRole,
        "Settings": {
          "OutputGroups": [
            {
              "Name": "File Group",
              "OutputGroupSettings": {
                "Type": "FILE_GROUP_SETTINGS",
                "FileGroupSettings": {
                  "Destination": params.outputVideoS3Path
                }
              },
              "Outputs": [
                {
                  "VideoDescription": {
                    "ScalingBehavior": "DEFAULT",
                    "TimecodeInsertion": "DISABLED",
                    "AntiAlias": "ENABLED",
                    "Sharpness": 50,
                    "CodecSettings": {
                      "Codec": "H_264",
                      "H264Settings": {
                        "InterlaceMode": "PROGRESSIVE",
                        "NumberReferenceFrames": 3,
                        "Syntax": "DEFAULT",
                        "Softness": 0,
                        "GopClosedCadence": 1,
                        "GopSize": 90,
                        "Slices": 1,
                        "GopBReference": "DISABLED",
                        "SlowPal": "DISABLED",
                        "SpatialAdaptiveQuantization": "ENABLED",
                        "TemporalAdaptiveQuantization": "ENABLED",
                        "FlickerAdaptiveQuantization": "DISABLED",
                        "EntropyEncoding": "CABAC",
                        "Bitrate": 5000000,
                        "FramerateControl": "SPECIFIED",
                        "RateControlMode": "CBR",
                        "CodecProfile": "MAIN",
                        "Telecine": "NONE",
                        "MinIInterval": 0,
                        "AdaptiveQuantization": "HIGH",
                        "CodecLevel": "AUTO",
                        "FieldEncoding": "PAFF",
                        "SceneChangeDetect": "ENABLED",
                        "QualityTuningLevel": "SINGLE_PASS",
                        "FramerateConversionAlgorithm": "DUPLICATE_DROP",
                        "UnregisteredSeiTimecode": "DISABLED",
                        "GopSizeUnits": "FRAMES",
                        "ParControl": "SPECIFIED",
                        "NumberBFramesBetweenReferenceFrames": 2,
                        "RepeatPps": "DISABLED",
                        "FramerateNumerator": 30,
                        "FramerateDenominator": 1,
                        "ParNumerator": 1,
                        "ParDenominator": 1
                      }
                    },
                    "AfdSignaling": "NONE",
                    "DropFrameTimecode": "ENABLED",
                    "RespondToAfd": "NONE",
                    "ColorMetadata": "INSERT"
                  },
                  "AudioDescriptions": [
                    {
                      "AudioTypeControl": "FOLLOW_INPUT",
                      "CodecSettings": {
                        "Codec": "AAC",
                        "AacSettings": {
                          "AudioDescriptionBroadcasterMix": "NORMAL",
                          "RateControlMode": "CBR",
                          "CodecProfile": "LC",
                          "CodingMode": "CODING_MODE_2_0",
                          "RawFormat": "NONE",
                          "SampleRate": 48000,
                          "Specification": "MPEG4",
                          "Bitrate": 64000
                        }
                      },
                      "LanguageCodeControl": "FOLLOW_INPUT",
                      "AudioSourceName": "Audio Selector 1"
                    }
                  ],
                  "ContainerSettings": {
                    "Container": "MP4",
                    "Mp4Settings": {
                      "CslgAtom": "INCLUDE",
                      "FreeSpaceBox": "EXCLUDE",
                      "MoovPlacement": "PROGRESSIVE_DOWNLOAD"
                    }
                  }
                }
              ]
            }
          ],
          "AdAvailOffset": 0,
          "Inputs": [
            {
              "AudioSelectors": {
                "Audio Selector 1": {
                  "Offset": 0,
                  "DefaultSelection": "NOT_DEFAULT",
                  "ProgramSelection": 1,
                  "SelectorType": "TRACK",
                  "Tracks": [
                    1
                  ]
                }
              },
              "VideoSelector": {
                "ColorSpace": "FOLLOW"
              },
              "FilterEnable": "AUTO",
              "PsiControl": "USE_PSI",
              "FilterStrength": 0,
              "DeblockFilter": "DISABLED",
              "DenoiseFilter": "DISABLED",
              "TimecodeSource": "EMBEDDED",
              "FileInput": params.inputS3Path
            }
          ],
          "TimecodeConfig": {
            "Source": "EMBEDDED"
          }
        }
      };

      // Create a promise on a MediaConvert object
    var createJobPromise = new AWS.MediaConvert({endpoint: 'https://qe6iufo8c.mediaconvert.ap-southeast-2.amazonaws.com'}).createJob(transcodeParams).promise();
    
    // Handle promise's fulfilled/rejected status
    createJobPromise.then(
      function(data) {
        console.log("Job created! ", data);
      },
      function(err) {
        console.log("Error", err);
      }
    );
    return;
}

transcode(params);