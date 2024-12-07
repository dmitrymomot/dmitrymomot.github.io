package main

type Config struct {
	Site      SiteConfig      `yaml:"site"`
	Social    SocialConfig    `yaml:"social"`
	Header    HeaderConfig    `yaml:"header"`
	Services  ServicesConfig  `yaml:"services"`
	Projects  ProjectsConfig  `yaml:"projects"`
	Expertise ExpertiseConfig `yaml:"expertise"`
	Footer    FooterConfig    `yaml:"footer"`
}

type SiteConfig struct {
	Title       string `yaml:"title"`
	Description string `yaml:"description"`
	Author      string `yaml:"author"`
	Email       string `yaml:"email"`
	Build       string `yaml:"build"`
	RelPath     string `yaml:"rel_path"`
}

type SocialConfig struct {
	Github   string `yaml:"github"`
	Linkedin string `yaml:"linkedin"`
	Twitter  string `yaml:"twitter"`
}

type HeaderConfig struct {
	Title       []string    `yaml:"title"`
	Description string      `yaml:"description"`
	CTA         []CTAConfig `yaml:"cta"`
}

type CTAConfig struct {
	Label string `yaml:"label"`
	URL   string `yaml:"url"`
	Icon  string `yaml:"icon"`
}

type ServicesConfig struct {
	Title string        `yaml:"title"`
	Items []ServiceItem `yaml:"items"`
}

type ServiceItem struct {
	Title       string `yaml:"title"`
	Description string `yaml:"description"`
	Icon        string `yaml:"icon"`
}

type ProjectsConfig struct {
	Title       string        `yaml:"title"`
	ProfileLink string        `yaml:"profile_link"`
	Items       []ProjectItem `yaml:"items"`
}

type ProjectItem struct {
	Title       string   `yaml:"title"`
	URL         string   `yaml:"url"`
	Description string   `yaml:"description"`
	Tags        []string `yaml:"tags"`
}

type ExpertiseConfig struct {
	Title      string              `yaml:"title"`
	Categories []ExpertiseCategory `yaml:"categories"`
}

type ExpertiseCategory struct {
	Title  string   `yaml:"title"`
	Icon   string   `yaml:"icon"`
	Skills []string `yaml:"skills"`
}

type FooterConfig struct {
	Copyright string      `yaml:"copyright"`
	License   LicenseInfo `yaml:"license"`
}

type LicenseInfo struct {
	Text        string `yaml:"text"`
	URL         string `yaml:"url"`
	LicenseType string `yaml:"license_type"`
	LicenseURL  string `yaml:"license_url"`
}
