/**
 * Mast for Astro: every component and the base layout, as named exports.
 *
 *   import { Section, Row, Col, Button } from "mast-astro";
 *   import "mast-astro/styles"; // BaseLayout / BaseHead do this for you
 *
 * Each file is also importable directly, e.g.
 * "mast-astro/components/Section.astro". Importing a component ships no
 * JavaScript until it is rendered on a page.
 */

export { default as Accordion } from "./components/Accordion.astro";
export { default as BaseHead } from "./components/BaseHead.astro";
export { default as Button } from "./components/Button.astro";
export { default as Card } from "./components/Card.astro";
export { default as CardBody } from "./components/CardBody.astro";
export { default as Choice } from "./components/Choice.astro";
export { default as Col } from "./components/Col.astro";
export { default as ContentWrap } from "./components/ContentWrap.astro";
export { default as Divider } from "./components/Divider.astro";
export { default as Field } from "./components/Field.astro";
export { default as Footer } from "./components/Footer.astro";
export { default as Form } from "./components/Form.astro";
export { default as Icon } from "./components/Icon.astro";
export { default as Img } from "./components/Img.astro";
export { default as InlineVideo } from "./components/InlineVideo.astro";
export { default as Marquee } from "./components/Marquee.astro";
export { default as Modal } from "./components/Modal.astro";
export { default as Nav } from "./components/Nav.astro";
export { default as NavBanner } from "./components/NavBanner.astro";
export { default as NavDropdown } from "./components/NavDropdown.astro";
export { default as Row } from "./components/Row.astro";
export { default as Section } from "./components/Section.astro";
export { default as Slide } from "./components/Slide.astro";
export { default as Slider } from "./components/Slider.astro";
export { default as Spacer } from "./components/Spacer.astro";
export { default as TabPane } from "./components/TabPane.astro";
export { default as Tabs } from "./components/Tabs.astro";
export { default as ThemeToggle } from "./components/ThemeToggle.astro";
export { default as BaseLayout } from "./layouts/BaseLayout.astro";

export type { FooterLink, SocialLink } from "./components/Footer.astro";
