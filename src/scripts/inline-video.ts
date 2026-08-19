/**
 * Inline video: lazy loading, scroll-in play, hover play, and play/pause
 * controls for `video[data-video]` elements. Port of Mast's
 * inline-video.js.
 */

interface VideoLibraryOptions {
  rootMargin?: string;
  threshold?: number;
  scrollTriggerThreshold?: number;
}

export class VideoLibrary {
  private options: Required<VideoLibraryOptions>;
  private prefersReducedMotion: boolean;
  private videoObserver: IntersectionObserver | null = null;
  private scrollObservers = new Map<HTMLVideoElement, IntersectionObserver>();
  private pictureElementCache = new WeakMap<
    HTMLVideoElement,
    HTMLElement | null
  >();

  constructor(options: VideoLibraryOptions = {}) {
    this.options = {
      rootMargin: options.rootMargin ?? "100px",
      threshold: options.threshold ?? 0,
      scrollTriggerThreshold: options.scrollTriggerThreshold ?? 0.5,
    };
    this.prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    this.init();
  }

  private init() {
    const videos =
      document.querySelectorAll<HTMLVideoElement>("video[data-video]");
    if (videos.length === 0) return;

    this.removeDesktopOnlyVideos();
    this.setupLazyLoading();
    this.setupVideoControls();
    this.setupHoverPlay();

    const desktopOnlyVideos = document.querySelectorAll(
      'video[data-video-desktop-only="true"]',
    );
    if (desktopOnlyVideos.length > 0) {
      let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.removeDesktopOnlyVideos();
        }, 150);
      });
    }
  }

  private getComponentContainer(video: HTMLVideoElement): HTMLElement | null {
    return (
      video.closest<HTMLElement>('[data-video="component"]') ||
      video.parentElement
    );
  }

  private removeDesktopOnlyVideos() {
    const desktopOnlyVideos = document.querySelectorAll<HTMLVideoElement>(
      'video[data-video-desktop-only="true"]',
    );
    const isSmallScreen = window.innerWidth <= 991;

    desktopOnlyVideos.forEach((video) => {
      const container = this.getComponentContainer(video);
      const playbackWrapper =
        container?.querySelector<HTMLElement>(
          '[data-video-playback="wrapper"]',
        ) ?? null;

      if (isSmallScreen) {
        video.style.display = "none";
        this.showPictureElement(video);
        if (playbackWrapper) {
          playbackWrapper.style.display = "none";
          playbackWrapper.style.visibility = "hidden";
          playbackWrapper.setAttribute("aria-hidden", "true");
        }
      } else {
        video.style.display = "";
        this.hidePictureElement(video);
        if (playbackWrapper) {
          playbackWrapper.style.display = "";
          playbackWrapper.style.visibility = "";
          playbackWrapper.setAttribute("aria-hidden", "false");
        }
      }
    });
  }

  private setupLazyLoading() {
    const videos =
      document.querySelectorAll<HTMLVideoElement>("video[data-video]");
    if (videos.length === 0) return;

    this.videoObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const video = entry.target as HTMLVideoElement;
            this.lazyLoadVideo(video)
              .then(() => observer.unobserve(video))
              .catch(console.error);
          }
        });
      },
      {
        root: null,
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold,
      },
    );

    videos.forEach((video) => {
      const scrollInPlay =
        video.getAttribute("data-video-scroll-in-play") === "true";
      const hoverPlay = video.getAttribute("data-video-hover") === "true";

      this.videoObserver!.observe(video);

      if (hoverPlay && scrollInPlay) {
        this.setupScrollInPlayForHover(video);
      } else if (hoverPlay) {
        // Hover-only: handled in setupHoverPlay.
      } else if (this.prefersReducedMotion) {
        video.pause();
      } else if (scrollInPlay) {
        this.setupScrollInPlay(video);
      } else {
        this.setupAutoplay(video);
      }
    });
  }

  private lazyLoadVideo(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const source = video.querySelector<HTMLSourceElement>("source[data-src]");
      if (source && !source.src) {
        source.src = source.getAttribute("data-src") ?? "";
        video.load();
      } else if (!source || video.readyState >= 3) {
        // No lazy source, or already loaded enough to play through.
        resolve();
        return;
      }
      // Still loading (first call, or a repeat call before data arrived):
      // resolve only once the video can actually play, so the poster is
      // never hidden over an empty video.
      video.addEventListener("canplaythrough", function onCanPlayThrough() {
        video.removeEventListener("canplaythrough", onCanPlayThrough);
        resolve();
      });
      video.addEventListener("error", function onError() {
        video.removeEventListener("error", onError);
        reject(
          new Error(`Error loading video: ${source?.src ?? video.currentSrc}`),
        );
      });
    });
  }

  private showPictureElement(video: HTMLVideoElement) {
    const picture = this.findPictureElement(video);
    if (picture) picture.style.display = "block";
  }

  private hidePictureElement(video: HTMLVideoElement) {
    const picture = this.findPictureElement(video);
    if (picture) picture.style.display = "none";
  }

  private findPictureElement(video: HTMLVideoElement): HTMLElement | null {
    if (this.pictureElementCache.has(video)) {
      return this.pictureElementCache.get(video) ?? null;
    }

    let pictureElement: HTMLElement | null = null;

    let sibling = video.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === "PICTURE" || sibling.tagName === "IMG") {
        pictureElement = sibling as HTMLElement;
        break;
      }
      sibling = sibling.previousElementSibling;
    }

    if (!pictureElement) {
      pictureElement =
        this.getComponentContainer(video)?.querySelector<HTMLElement>(
          "picture, img",
        ) ?? null;
    }

    this.pictureElementCache.set(video, pictureElement);
    return pictureElement;
  }

  private setupVideoControls() {
    document
      .querySelectorAll<HTMLVideoElement>("video[data-video]")
      .forEach((video) => {
        this.handlePlaybackButtons(video);
      });
  }

  private setupHoverPlay() {
    const hoverVideos = document.querySelectorAll<HTMLVideoElement>(
      'video[data-video-hover="true"]',
    );

    hoverVideos.forEach((video) => {
      const container = this.getComponentContainer(video);
      const trigger = container || video;
      let hasPlayedOnce = false;

      this.showPictureElement(video);

      // Hover is the primary interaction; hide the play button from AT.
      const playbackButton = container?.querySelector<HTMLElement>(
        '[data-video-playback="button"]',
      );
      if (playbackButton) {
        playbackButton.setAttribute("aria-hidden", "true");
        playbackButton.setAttribute("tabindex", "-1");
      }

      trigger.addEventListener("mouseenter", async () => {
        if (this.prefersReducedMotion) return;
        try {
          this.hidePictureElement(video);
          await this.lazyLoadVideo(video);
          if (!hasPlayedOnce) {
            video.currentTime = 0;
            hasPlayedOnce = true;
          }
          video.play();
        } catch (error) {
          console.error("Error playing hover video:", error);
        }
      });

      trigger.addEventListener("mouseleave", () => {
        video.pause();
      });
    });
  }

  private setupAutoplay(video: HTMLVideoElement) {
    video.addEventListener("canplaythrough", () => {
      if (!this.prefersReducedMotion) {
        this.hidePictureElement(video);
        video.play().catch(console.error);
      }
    });
  }

  private setupScrollInPlay(video: HTMLVideoElement) {
    let hasPlayedOnce = false;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.lazyLoadVideo(video)
              .then(() => {
                if (!this.prefersReducedMotion) {
                  this.hidePictureElement(video);
                  if (!hasPlayedOnce) {
                    video.currentTime = 0;
                    hasPlayedOnce = true;
                  }
                  video.play();
                }
              })
              .catch(console.error);
          } else {
            video.pause();
          }
        }
      },
      { threshold: this.options.scrollTriggerThreshold },
    );

    observer.observe(video);
    this.scrollObservers.set(video, observer);
  }

  private setupScrollInPlayForHover(video: HTMLVideoElement) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.lazyLoadVideo(video)
              .then(() => {
                video.pause();
                this.showPictureElement(video);
              })
              .catch(console.error);
          }
        }
      },
      { threshold: this.options.scrollTriggerThreshold },
    );

    observer.observe(video);
    this.scrollObservers.set(video, observer);
  }

  private handlePlaybackButtons(video: HTMLVideoElement) {
    const container = this.getComponentContainer(video);
    if (!container) return;

    const playbackButton = container.querySelector<HTMLElement>(
      '[data-video-playback="button"]',
    );
    if (!playbackButton) return;

    const playIcon = playbackButton.querySelector<HTMLElement>(
      '[data-video-playback="play"]',
    );
    const pauseIcon = playbackButton.querySelector<HTMLElement>(
      '[data-video-playback="pause"]',
    );
    if (!playIcon || !pauseIcon) return;

    const toggleButtonState = (isPlaying: boolean) => {
      if (isPlaying) {
        playIcon.style.display = "none";
        playIcon.style.visibility = "hidden";
        playIcon.setAttribute("aria-hidden", "true");
        pauseIcon.style.display = "flex";
        pauseIcon.style.visibility = "visible";
        pauseIcon.setAttribute("aria-hidden", "false");
        playbackButton.setAttribute("aria-label", "Pause video");
      } else {
        playIcon.style.display = "flex";
        playIcon.style.visibility = "visible";
        playIcon.setAttribute("aria-hidden", "false");
        pauseIcon.style.display = "none";
        pauseIcon.style.visibility = "hidden";
        pauseIcon.setAttribute("aria-hidden", "true");
        playbackButton.setAttribute("aria-label", "Play video");
      }
    };

    toggleButtonState(!video.paused);

    playbackButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      if (video.paused) {
        try {
          await this.lazyLoadVideo(video);
          this.hidePictureElement(video);
          video.play();
          toggleButtonState(true);
        } catch (error) {
          console.error(error);
        }
      } else {
        video.pause();
        toggleButtonState(false);
      }
    });

    video.addEventListener("play", () => toggleButtonState(true));
    video.addEventListener("pause", () => toggleButtonState(false));
  }
}

export function initInlineVideos() {
  if (document.querySelectorAll("video[data-video]").length > 0) {
    new VideoLibrary();
  }
}
