package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/dto"
)

// 장소 공급자 호출이 끊기지 않고 끝나도록 두 공급자에 같은 제한 시간을 적용한다.
var placeSearchHTTPClient = &http.Client{Timeout: 10 * time.Second}

const amapPlaceSearchEndpoint = "https://restapi.amap.com/v5/place/text"

func searchAmapPlaces(query string) ([]dto.PlaceSearchResult, error) {
	key := os.Getenv("AMAP_API_KEY")
	if key == "" {
		return nil, errors.New("amap api key not found")
	}

	requestURL, err := buildAmapPlaceSearchURL(query, key)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest(http.MethodGet, requestURL, nil)
	if err != nil {
		return nil, err
	}
	resp, err := placeSearchHTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("amap api status code: %d", resp.StatusCode)
	}

	var data struct {
		Status string `json:"status"`
		Pois   []struct {
			ID       string `json:"id"`
			Name     string `json:"name"`
			Address  string `json:"address"`
			Location string `json:"location"`
		} `json:"pois"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}
	if data.Status != "1" {
		return nil, fmt.Errorf("amap api error status: %s", data.Status)
	}

	results := make([]dto.PlaceSearchResult, 0, len(data.Pois))
	for _, poi := range data.Pois {
		var latitude, longitude *float64
		coords := strings.Split(poi.Location, ",")
		if len(coords) == 2 {
			if value, parseErr := strconv.ParseFloat(coords[0], 64); parseErr == nil {
				longitude = &value
			}
			if value, parseErr := strconv.ParseFloat(coords[1], 64); parseErr == nil {
				latitude = &value
			}
		}

		results = append(results, dto.PlaceSearchResult{
			Name:           poi.Name,
			Address:        poi.Address,
			Latitude:       latitude,
			Longitude:      longitude,
			ChineseName:    poi.Name,
			ChineseAddress: poi.Address,
		})
	}
	return results, nil
}

func buildAmapPlaceSearchURL(query, key string) (string, error) {
	requestURL, err := url.Parse(amapPlaceSearchEndpoint)
	if err != nil {
		return "", err
	}

	keywords, placeType := normalizeAmapSearchQuery(query)
	params := requestURL.Query()
	params.Set("key", key)
	params.Set("keywords", keywords)
	params.Set("region", "上海市")
	params.Set("city_limit", "true")
	params.Set("page_size", "20")
	params.Set("page_num", "1")
	if placeType != "" {
		params.Set("types", placeType)
	}
	requestURL.RawQuery = params.Encode()
	return requestURL.String(), nil
}

func normalizeAmapSearchQuery(query string) (keywords, placeType string) {
	normalized := strings.ToLower(strings.TrimSpace(query))
	switch normalized {
	case "카페", "커피", "커피숍", "cafe", "coffee":
		return "咖啡店", "050000"
	case "식당", "음식점", "맛집", "레스토랑", "restaurant", "food":
		return "餐厅", "050000"
	default:
		return strings.TrimSpace(query), ""
	}
}

func searchGooglePlaces(query string) ([]dto.PlaceSearchResult, error) {
	key := os.Getenv("GOOGLE_MAPS_API_KEY")
	if key == "" {
		return nil, errors.New("google maps api key not found")
	}

	reqBody, err := json.Marshal(map[string]string{"textQuery": query})
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
		results = append(results, dto.PlaceSearchResult{
			Name:          place.DisplayName.Text,
			Address:       place.FormattedAddress,
			Latitude:      &latitude,
			Longitude:     &longitude,
			GooglePlaceID: place.ID,
		})
	}
	return results, nil
}
