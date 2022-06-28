package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"sync"
	"time"
)

func main() {
	cfg := GetConfig()

	httpServer := gin.Default()

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	//config.AllowOrigins = []string{"http://google.com", "http://facebook.com"}
	// config.AllowAllOrigins = true

	// //uncomment yg ini
	// config.AllowOrigins = []string{"http://13.213.186.104/"}
	// config.AllowAllOrigins = false

	httpServer.Use(cors.New(corsConfig))

	httpServer.POST("/save", SaveDiagram)

	err := httpServer.Run(":" + cfg.Server.Http.Port)

	if err != nil {
		logrus.Errorln(err)
	}


	//logrus.Println(cfg)
}

type SaveDiagramForm struct {

	Content string `form:"content" binding:"required"`
	ContentImage *multipart.FileHeader `form:"content_image" binding:"required"`
	FileName string `form:"filename" binding:"required"`
}

func SaveDiagram (context *gin.Context)  {

	cfg := GetConfig()

	sharepoint := SharepointService{
		SharepointCredential:   cfg.SharepointCredential,
		SharepointStorage:      cfg.SharepointStorage,
		PreservedToken:         nil,
		PreservedTokenExpireAt: nil,
	}

	var form SaveDiagramForm

	if err := context.ShouldBind(&form); err != nil {

		context.JSON(http.StatusBadRequest, err)
		return
	}

	err := sharepoint.SaveDiagram(fmt.Sprintf("%s.dg", form.FileName), strings.NewReader(form.Content))


	if err != nil {
		context.JSON(http.StatusBadRequest, err)
		return
	}

	imageFileReader, err := form.ContentImage.Open()

	if err != nil {
		context.JSON(http.StatusBadRequest, err)
		return
	}

	err = sharepoint.SaveDiagram(fmt.Sprintf("%s.thumb.png", form.FileName), imageFileReader)

	if err != nil {
		context.JSON(http.StatusBadRequest, err)
		return
	}

	context.JSON(http.StatusOK, "ok")
	return
}

type Configuration struct {
	Application Application
	Server Server
	SharepointCredential SharepointCredential
	SharepointStorage SharepointStorage
}


type Application struct {
	Environment 	string
	Version 		string
	Domain 			string
}

type SharepointCredential struct {
	ClientId 	string
	ClientSecret string
	AccessTokenUrl string
	Scope string
}

type SharepointStorage struct {

	TargetFolder string
	SiteId string
}

type Server struct {
	Http HttpConfig
}

type HttpConfig struct {
	Port 	string
}

var configuration *Configuration
var once sync.Once

func GetConfig() *Configuration {

	once.Do(func() {
		viper.SetConfigName("config")
		viper.SetConfigType("yaml")
		viper.AddConfigPath(".")

		if err := viper.ReadInConfig(); err != nil {
			logrus.Fatalf("Error reading config file, %s", err)
		}

		if err := viper.Unmarshal(&configuration); err != nil {
			logrus.Fatalf("Unable to decode into struct, %v", err)
		}
	})

	return configuration
}

// Sharepoint logic

type SharepointService struct {

	SharepointCredential SharepointCredential
	SharepointStorage SharepointStorage
	PreservedToken *string
	PreservedTokenExpireAt *time.Time
}

func (s *SharepointService) GetAccessToken() (*GetAccessTokenResponse, error) {

	payload := &bytes.Buffer{}

	writer := multipart.NewWriter(payload)

	err := writer.WriteField("grant_type", "client_credentials")

	if err != nil {
		return nil, err
	}

	err = writer.WriteField("client_id", s.SharepointCredential.ClientId)

	if err != nil {
		return nil, err
	}

	err = writer.WriteField("client_secret", s.SharepointCredential.ClientSecret)

	if err != nil {
		return nil, err
	}

	err = writer.WriteField("scope", s.SharepointCredential.Scope)

	if err != nil {
		return nil, err
	}

	err = writer.Close()

	if err != nil {
		return nil, err
	}


	httpClient := http.Client{}
	req, err := http.NewRequest("POST", s.SharepointCredential.AccessTokenUrl, payload)

	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	res, err := httpClient.Do(req)

	if err != nil {
		return nil, err
	}


	defer func(Body io.ReadCloser) {
		err := Body.Close()

		if err != nil {

		}
	}(res.Body)

	logrus.Println("Here")
	var response GetAccessTokenResponse

	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		return nil, err
	}


	return &response, nil

}

func (s *SharepointService) SaveDiagram(fileName string, file io.Reader) error {

	url := fmt.Sprintf("https://graph.microsoft.com/v1.0/sites/%v/drive/root:/%v/%v:/content", s.SharepointStorage.SiteId, s.SharepointStorage.TargetFolder, fileName)
	method := "PUT"
	token, err := s.getPreservedAccessToken()

	logrus.Println(token)

	if err != nil {
		return err
	}

	client := http.Client{}

	if err != nil {
		return err
	}

	request, err := http.NewRequest(method, url, file)

	request.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))
	request.Header.Add("Content-Type", "multipart/form-data")

	res, err := client.Do(request)

	if err != nil {
		return err
	}

	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {

		}
	}(res.Body)

	var result SaveDiagramResponse

	if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
		return err
	}

	logrus.Println(result)

	return nil
}



func (s SharepointService) GetListDiagrams(accessToken string) {
	panic("implement me")
}

func (s *SharepointService) getPreservedAccessToken() (string, error)  {

	if s.PreservedToken != nil && s.PreservedTokenExpireAt != nil && s.PreservedTokenExpireAt.After(time.Now()){

		return *s.PreservedToken, nil
	}

	fetchedToken, err := s.GetAccessToken()

	if err != nil {
		return "", err
	}

	token := fetchedToken.AccessToken
	margin := int64(1 * 60) // 1 minute

	expireIn := time.Duration(fetchedToken.ExpiresIn - margin) * time.Second
	expireAt := time.Now().Add(expireIn)

	s.PreservedTokenExpireAt = &expireAt
	s.PreservedToken = &token

	return token, nil
}

type GetAccessTokenResponse struct {

	TokenType string `json:"token_type"`
	ExpiresIn int64 `json:"expires_in"`
	ExtExpiresIn int64 `json:"ext_expires_in"`
	AccessToken string `json:"access_token"`
}

type SaveDiagramResponse struct {

	OdataContext string `json:"@odata.context"`
	DownloadUrl string `json:"@microsoft.graph.downloadUrl"`
	CreatedDateTime time.Time `json:"createdDateTime"`
	ETag string `json:"eTag"`
	Id string `json:"id"`
	LastModifiedDateTime time.Time `json:"lastModifiedDateTime"`
	Name string `json:"name"`
	WebUrl string `json:"webUrl"`
	CTag string `json:"cTag"`
	Size int64 `json:"size"`
}