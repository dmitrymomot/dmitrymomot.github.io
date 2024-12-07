# Personal Website

A modern, minimalist personal website built with Go, HTML templates, and TailwindCSS. The site features a responsive design, interactive particle background, and sections for showcasing professional experience and expertise.

## Features

- 🎨 Modern, clean design with dark theme
- 🌟 Interactive particle.js background
- 📱 Fully responsive layout
- ⚡️ Static site generation
- 🎯 SEO-friendly
- 🛠 Configurable content via YAML
- 💨 TailwindCSS for styling

## Project Structure

```
.
├── public/                  # Generated static site
│   ├── assets/             # Static assets
│   ├── index.html          # Generated home page
│   └── 404.html            # Generated 404 page
├── src/
│   ├── assets/             # Source assets
│   │   ├── tailwind.config.js
│   │   └── tailwind.css
│   ├── templates/          # HTML templates
│   │   ├── layout.html
│   │   ├── main.html
│   │   └── 404.html
│   ├── config.go           # Configuration structs
│   ├── config.yml          # Site configuration
│   └── main.go             # Site generator
├── Makefile                 # Build automation
├── CNAME                    # Custom domain config
└── README.md
```

## Prerequisites

- Go 1.20 or later
- Node.js and npm (for TailwindCSS)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/personal-website.git
   cd personal-website
   ```

2. Install TailwindCSS:
   ```bash
   npm install -g tailwindcss
   ```

3. Install Go dependencies:
   ```bash
   go mod tidy
   ```

## Configuration

Customize the website content by editing `src/config.yml`. The configuration includes:

- Site metadata (title, description, etc.)
- Social media links
- Header content and CTAs
- Services section
- Featured projects
- Technical expertise
- Footer information

## Development

To build the site:

```bash
make build
```

This command will:
1. Generate the CSS file using TailwindCSS
2. Process the templates and generate static HTML files

## Deployment

The site is designed to be deployed on GitHub Pages:

1. Push the repository to GitHub
2. Enable GitHub Pages in repository settings
3. Set the custom domain in the repository settings (if using one)
4. The `CNAME` file will handle domain configuration

## Customization

### Styling

- Modify `src/assets/tailwind.css` for custom styles
- Update `src/assets/tailwind.config.js` for TailwindCSS configuration

### Templates

- Edit files in `src/templates/` to modify the HTML structure
- The site uses Go's html/template for templating

### Content

- Update `src/config.yml` to modify site content
- Add new sections by updating both config and templates

## License

This project is licensed under CC BY-NC-ND 4.0 - see [LICENSE](https://creativecommons.org/licenses/by-nc-nd/4.0/) for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- [TailwindCSS](https://tailwindcss.com/) for styling
- [Particles.js](https://vincentgarreau.com/particles.js/) for the interactive background
- [Feather Icons](https://feathericons.com/) for the icon set
