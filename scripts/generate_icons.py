from PIL import Image, ImageDraw


SIZES = [16, 32, 48, 128, 512]
BG = (252, 77, 80, 255)
BG_DARK = (224, 62, 65, 255)
WHITE = (255, 255, 255, 255)


def make_icon(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    radius = int(size * 0.22)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=BG)

    shadow_h = int(size * 0.35)
    draw.rectangle((0, size - shadow_h, size, size), fill=BG_DARK)

    margin_x = int(size * 0.2)
    margin_y = int(size * 0.18)
    shelf_gap = int(size * 0.14)
    shelf_w = int(size * 0.14)
    shelf_h = int(size * 0.62)

    x = margin_x
    for _ in range(3):
        draw.rounded_rectangle(
            (x, margin_y, x + shelf_w, margin_y + shelf_h),
            radius=max(1, int(size * 0.04)),
            fill=WHITE,
        )
        x += shelf_w + shelf_gap

    base_y = margin_y + shelf_h + int(size * 0.03)
    draw.rounded_rectangle(
        (
            margin_x - int(size * 0.03),
            base_y,
            size - margin_x + int(size * 0.03),
            base_y + int(size * 0.08),
        ),
        radius=max(1, int(size * 0.02)),
        fill=WHITE,
    )

    return image


def main() -> None:
    for size in SIZES:
        icon = make_icon(size)
        icon.save(f"public/icons/icon-{size}.png", format="PNG")


if __name__ == "__main__":
    main()
