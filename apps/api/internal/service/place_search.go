package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
	"unicode"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/dto"
)

// 장소 공급자 호출이 끊기지 않고 끝나도록 제한 시간을 적용한다.
var placeSearchHTTPClient = &http.Client{Timeout: 10 * time.Second}

type googleTextSearchRequest struct {
	TextQuery           string                     `json:"textQuery"`
	PageSize            int                        `json:"pageSize"`
	LanguageCode        string                     `json:"languageCode,omitempty"`
	RegionCode          string                     `json:"regionCode,omitempty"`
	IncludedType        string                     `json:"includedType,omitempty"`
	StrictTypeFiltering bool                       `json:"strictTypeFiltering,omitempty"`
	LocationRestriction *googleLocationRestriction `json:"locationRestriction,omitempty"`
}

type googleLocationRestriction struct {
	Rectangle googleRectangle `json:"rectangle"`
}

type googleRectangle struct {
	Low  googleCoordinate `json:"low"`
	High googleCoordinate `json:"high"`
}

type googleCoordinate struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

func buildGoogleTextSearchRequest(query, country string) googleTextSearchRequest {
	request := googleTextSearchRequest{TextQuery: strings.TrimSpace(query), PageSize: 20}
	if country != "CN" {
		return request
	}

	request.LanguageCode = "zh-CN"
	if containsHangul(request.TextQuery) {
		request.LanguageCode = "ko"
	}
	request.RegionCode = "CN"
	request.LocationRestriction = &googleLocationRestriction{Rectangle: googleRectangle{
		Low:  googleCoordinate{Latitude: 30.67, Longitude: 120.85},
		High: googleCoordinate{Latitude: 31.88, Longitude: 122.20},
	}}
	switch strings.ToLower(request.TextQuery) {
	case "카페", "커피", "커피숍", "cafe", "coffee", "咖啡", "咖啡店":
		request.IncludedType = "cafe"
		request.StrictTypeFiltering = true
	case "식당", "음식점", "맛집", "레스토랑", "restaurant", "food", "餐厅":
		request.IncludedType = "restaurant"
		request.StrictTypeFiltering = true
	}
	return request
}

func containsHangul(value string) bool {
	for _, character := range value {
		if unicode.In(character, unicode.Hangul) {
			return true
		}
	}
	return false
}

func containsHan(value string) bool {
	for _, character := range value {
		if unicode.In(character, unicode.Han) {
			return true
		}
	}
	return false
}

func searchGooglePlaces(query, country string) ([]dto.PlaceSearchResult, error) {
	key := os.Getenv("GOOGLE_MAPS_API_KEY")
	if key == "" {
		return nil, errors.New("google maps api key not found")
	}

	reqBody, err := json.Marshal(buildGoogleTextSearchRequest(query, country))
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest(http.MethodPost, "https://places.googleapis.com/v1/places:searchText", bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Goog-Api-Key", key)
	req.Header.Set("X-Goog-FieldMask", "places.id,places.displayName,places.formattedAddress,places.location")

	resp, err := placeSearchHTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google places api status: %d", resp.StatusCode)
	}

	var data struct {
		Places []struct {
			ID          string `json:"id"`
			DisplayName struct {
				Text string `json:"text"`
			} `json:"displayName"`
			FormattedAddress string `json:"formattedAddress"`
			Location         struct {
				Latitude  float64 `json:"latitude"`
				Longitude float64 `json:"longitude"`
			} `json:"location"`
		} `json:"places"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	results := make([]dto.PlaceSearchResult, 0, len(data.Places))
	for _, place := range data.Places {
		latitude := place.Location.Latitude
		longitude := place.Location.Longitude
		result := dto.PlaceSearchResult{
			Name:          place.DisplayName.Text,
			Address:       place.FormattedAddress,
			Latitude:      &latitude,
			Longitude:     &longitude,
			GooglePlaceID: place.ID,
		}
		if country == "CN" {
			if containsHan(place.DisplayName.Text) {
				result.ChineseName = place.DisplayName.Text
			}
			if containsHan(place.FormattedAddress) {
				result.ChineseAddress = place.FormattedAddress
			}
		}
		results = append(results, result)
	}
	return results, nil
}
